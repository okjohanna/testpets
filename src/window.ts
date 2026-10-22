import {
  currentMonitor,
  getCurrentWindow,
  LogicalPosition,
  type Monitor,
} from "@tauri-apps/api/window";
import type { WindowSettings } from "./types";

/**
 * Everything about the notebook window itself.
 *
 * The window is frameless, so the app has to place it on the desktop by
 * hand: in the bottom-right corner, just above the taskbar, and it has to
 * remember where the player dragged it.
 */

/** Gap between the notebook and the corner of the screen, in logical pixels. */
export const CORNER_GAP = 12;

/** A rectangle in desktop coordinates. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The part of the monitor that is not covered by the taskbar.
 *
 * Tauri reports the work area either in absolute desktop coordinates or
 * relative to the monitor, depending on the platform. We work out which one
 * we got by checking which reading fits inside the monitor.
 */
function workAreaInDesktopCoords(monitor: Monitor): Box {
  const area = monitor.workArea;

  const absolute: Box = {
    x: area.position.x,
    y: area.position.y,
    width: area.size.width,
    height: area.size.height,
  };

  const relative: Box = {
    x: monitor.position.x + area.position.x,
    y: monitor.position.y + area.position.y,
    width: area.size.width,
    height: area.size.height,
  };

  const fitsInside = (box: Box): boolean =>
    box.x >= monitor.position.x &&
    box.y >= monitor.position.y &&
    box.x + box.width <= monitor.position.x + monitor.size.width &&
    box.y + box.height <= monitor.position.y + monitor.size.height;

  if (fitsInside(absolute)) return absolute;
  if (fitsInside(relative)) return relative;
  return absolute;
}

/**
 * Put the notebook in the bottom-right corner of the screen, just above the
 * taskbar.
 */
export async function placeBottomRight(): Promise<void> {
  const win = getCurrentWindow();
  const monitor = await currentMonitor();
  if (!monitor) return;

  const scale = monitor.scaleFactor;
  const area = workAreaInDesktopCoords(monitor);
  const size = await win.outerSize();

  const right = (area.x + area.width) / scale;
  const bottom = (area.y + area.height) / scale;

  await win.setPosition(
    new LogicalPosition(
      Math.round(right - size.width / scale - CORNER_GAP),
      Math.round(bottom - size.height / scale - CORNER_GAP),
    ),
  );
}

/** The current position of the window, in logical pixels. */
export async function readWindowSettings(): Promise<WindowSettings> {
  const win = getCurrentWindow();
  const scale = await win.scaleFactor();
  const position = await win.outerPosition();

  return {
    x: Math.round(position.x / scale),
    y: Math.round(position.y / scale),
  };
}

/**
 * Move the notebook back to a saved position.
 *
 * The position is only used when it still lands on a screen - a player who
 * unplugged the monitor should not end up with a notebook in the void.
 */
export async function applyWindowSettings(settings: WindowSettings): Promise<void> {
  if (settings.x === null || settings.y === null) return;

  const win = getCurrentWindow();
  const monitor = await currentMonitor();
  if (!monitor) return;

  const scale = monitor.scaleFactor;
  const area = workAreaInDesktopCoords(monitor);

  // The notebook has a fixed size, so use its real size when clamping.
  const outer = await win.outerSize();
  const width = outer.width / scale;
  const height = outer.height / scale;

  const left = area.x / scale;
  const top = area.y / scale;
  const right = (area.x + area.width) / scale;
  const bottom = (area.y + area.height) / scale;

  const x = Math.min(Math.max(settings.x, left), Math.max(left, right - width));
  const y = Math.min(Math.max(settings.y, top), Math.max(top, bottom - height));

  await win.setPosition(new LogicalPosition(Math.round(x), Math.round(y)));
}

/**
 * Watch the player dragging the window so the new place can be saved.
 * Changes arrive in bursts while dragging, so we wait for the dust to
 * settle before reporting.
 */
export async function watchWindow(
  onChange: (settings: WindowSettings) => void,
): Promise<void> {
  const win = getCurrentWindow();
  let timer: number | undefined;

  const report = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void readWindowSettings().then(onChange);
    }, 300);
  };

  await win.onMoved(report);
}
