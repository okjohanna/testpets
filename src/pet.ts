import {
  currentMonitor,
  getCurrentWindow,
  LogicalPosition,
} from "@tauri-apps/api/window";
import { isPetId, PET_BY_ID } from "./pets";
import { applySizes, PET_WINDOW_SIZE } from "./sizes";
import { workAreaInDesktopCoords, type Box } from "./window";

/**
 * The roaming pet.
 *
 * This file runs inside the small, transparent pet window. It draws the pet
 * (a sprite when the pet has one, otherwise its placeholder colour), walks it
 * slowly to random spots and lets the player drag it around.
 */

/** How often the pet takes a step. */
const TICK_MS = 40;
/** How far it walks per tick (~60 logical pixels per second). */
const STEP_PX = 2.4;
/** The pet rests for a few seconds between walks. */
const WAIT_MIN_MS = 2000;
const WAIT_MAX_MS = 5000;

/** A drag has ended when the window stops moving for this long. */
const DRAG_IDLE_MS = 250;
/** After a drop the pet stays still for a moment before roaming again. */
const RESUME_DELAY_MS = 1500;
/** A click without any movement should not freeze the pet. */
const CLICK_GRACE_MS = 500;
/** Used when the window size cannot be read for some reason. */
const PET_WINDOW_SIZE_FALLBACK = PET_WINDOW_SIZE.width;

interface Point {
  x: number;
  y: number;
}

const win = getCurrentWindow();

/** The pet window's real size in logical pixels, read once at startup. */
let petSize = { width: 0, height: 0 };

/** Where the window is now, in logical pixels. */
let pos: Point = { x: 0, y: 0 };
/** True while the player is holding the pet. */
let dragging = false;
/** Roaming stays still until this time (after a drop). */
let resumeAt = 0;
let dragTimer: number | undefined;
let clickTimer: number | undefined;
let dragMoved = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** The window position in logical pixels. */
async function readPosition(): Promise<Point> {
  const scale = await win.scaleFactor();
  const raw = await win.outerPosition();
  return { x: raw.x / scale, y: raw.y / scale };
}

/** The window size in logical pixels, with a safe fallback. */
async function readWindowSize(): Promise<{ width: number; height: number }> {
  const scale = await win.scaleFactor();
  const raw = await win.outerSize();
  return {
    width: raw.width / scale || PET_WINDOW_SIZE_FALLBACK,
    height: raw.height / scale || PET_WINDOW_SIZE_FALLBACK,
  };
}

/** The work area of the screen the pet is on, in logical pixels. */
async function readBounds(): Promise<Box | null> {
  const monitor = await currentMonitor();
  if (!monitor) return null;

  const scale = monitor.scaleFactor;
  const area = workAreaInDesktopCoords(monitor);

  return {
    x: area.x / scale,
    y: area.y / scale,
    width: area.width / scale,
    height: area.height / scale,
  };
}

/** A random spot that keeps the whole pet inside the work area. */
function randomTarget(area: Box): Point {
  const maxX = Math.max(area.x, area.x + area.width - petSize.width);
  const maxY = Math.max(area.y, area.y + area.height - petSize.height);

  return {
    x: randomBetween(area.x, maxX),
    y: randomBetween(area.y, maxY),
  };
}

async function moveTo(point: Point): Promise<void> {
  pos = point;
  await win.setPosition(
    new LogicalPosition(Math.round(point.x), Math.round(point.y)),
  );
}

/** Walk towards the target until we arrive or the player grabs the pet. */
async function walkTo(target: Point): Promise<void> {
  while (!dragging) {
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= STEP_PX) {
      await moveTo(target);
      return;
    }

    await moveTo({
      x: pos.x + (dx / distance) * STEP_PX,
      y: pos.y + (dy / distance) * STEP_PX,
    });

    await sleep(TICK_MS);
  }
}

/** The main loop: pick a spot, walk there, rest, repeat. */
async function roam(): Promise<void> {
  pos = await readPosition();
  petSize = await readWindowSize();

  for (;;) {
    // Wait out a drag, and the short pause after dropping the pet.
    while (dragging || Date.now() < resumeAt) {
      await sleep(100);
    }

    // The player may have dropped the pet somewhere else.
    pos = await readPosition();

    const area = await readBounds();
    if (!area) {
      await sleep(1000);
      continue;
    }

    await walkTo(randomTarget(area));

    // A drag interrupted the walk; start over after the drop.
    if (dragging) continue;

    await sleep(randomBetween(WAIT_MIN_MS, WAIT_MAX_MS));
  }
}

function beginDrag(): void {
  dragging = true;
  dragMoved = false;
  window.clearTimeout(dragTimer);
  window.clearTimeout(clickTimer);

  // A plain click produces no onMoved event, so do not stay frozen forever.
  clickTimer = window.setTimeout(() => {
    if (!dragMoved) dragging = false;
  }, CLICK_GRACE_MS);

  void win.startDragging().catch((error) => {
    console.error("Could not drag the pet:", error);
    dragging = false;
  });
}

/** Use the window's own move events to notice when a drag has ended. */
async function watchDragEnd(): Promise<void> {
  await win.onMoved(() => {
    // While the pet walks by itself `dragging` is false; these events are our
    // own setPosition calls, not the player.
    if (!dragging) return;

    dragMoved = true;
    window.clearTimeout(dragTimer);

    dragTimer = window.setTimeout(() => {
      void readPosition().then((dropped) => {
        pos = dropped;
        resumeAt = Date.now() + RESUME_DELAY_MS;
        dragging = false;
      });
    }, DRAG_IDLE_MS);
  });
}

/** Read the pet id from the URL and paint the pet. */
function start(): void {
  applySizes();

  const id = new URLSearchParams(window.location.search).get("id");
  const element = document.querySelector<HTMLElement>("#pet");

  if (!isPetId(id)) {
    console.error("The pet window has an unknown pet id:", id);
    if (element) element.hidden = true;
    return;
  }

  const pet = PET_BY_ID[id];
  if (element) {
    element.style.setProperty("--pet-color", pet.color);
    element.title = pet.name;

    if (pet.sprite) {
      element.classList.add("has-sprite");
      element.style.setProperty("--pet-sprite", `url("${pet.sprite}")`);
    }
  }
  document.body.dataset.petId = id;
  document.title = pet.name;

  // The whole pet is the drag handle.
  document.body.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    beginDrag();
  });

  void watchDragEnd()
    .then(roam)
    .catch((error) => {
      console.error("Pet roaming stopped:", error);
    });
}

start();
