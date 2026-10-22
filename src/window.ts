import {
  currentMonitor,
  getCurrentWindow,
  LogicalPosition,
  LogicalSize,
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

/** The size the notebook starts with. */
export const DEFAULT_SIZE = { width: 360, height: 520 };

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

/** The current size and position of the window, in logical pixels. */
export async function readWindowSettings(): Promise<WindowSettings> {
  const win = getCurrentWindow();
  const scale = await win.scaleFactor();

  const size = await win.outerSize();
  const position = await win.outerPosition();

  return {
    width: Math.round(size.width / scale),
    height: Math.round(size.height / scale),
    x: Math.round(position.x / scale),
    y: Math.round(position.y / scale),
  };
}

/**
 * Apply a saved size and position.
 *
 * The position is only used when it still lands on a screen - a player who
 * unplugged the monitor should not end up with a notebook in the void.
 */
export async function applyWindowSettings(settings: WindowSettings): Promise<void> {
  const win = getCurrentWindow();

  await win.setSize(new LogicalSize(settings.width, settings.height));

  if (settings.x === null || settings.y === null) return;

  const monitor = await currentMonitor();
  if (!monitor) return;

  const scale = monitor.scaleFactor;
  const area = workAreaInDesktopCoords(monitor);

  const left = area.x / scale;
  const top = area.y / scale;
  const right = (area.x + area.width) / scale;
  const bottom = (area.y + area.height) / scale;

  const x = Math.min(Math.max(settings.x, left), Math.max(left, right - settings.width));
  const y = Math.min(Math.max(settings.y, top), Math.max(top, bottom - settings.height));

  await win.setPosition(new LogicalPosition(Math.round(x), Math.round(y)));
}

/**
 * Watch the player moving and resizing the window so the new place and size
 * can be saved. Changes arrive in bursts while dragging, so we wait for the
 * dust to settle before reporting.
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
  await win.onResized(report);
}
