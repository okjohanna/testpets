import type { AppState } from "./types";

/**
 * All the app rules live here.
 *
 * Nothing in this file touches the DOM or Tauri - every function takes an
 * `AppState` and returns a *new* state. That makes the rules easy to read,
 * easy to unit test, and impossible to break by accident from the UI layer.
 */

/**
 * Bump this whenever the shape of `AppState` changes. `loadState` then knows
 * the save on disk is from an older version and can migrate or discard it.
 */
export const STATE_VERSION = 2;

/** A short unique id. `crypto.randomUUID` is available in the WebView. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for the unit tests, which run outside the WebView.
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** The state a brand new install starts with. */
export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    coins: 0,
    tasks: [],
    unlockedPets: [],
    activePetId: null,
    window: { width: 360, height: 520, x: null, y: null },
  };
}

/**
 * Turn whatever was on disk into a state we can trust.
 *
 * A save file can be old, hand-edited or half written, so every field is
 * checked before it is used. Anything that does not make sense is replaced
 * with the default instead of crashing the app.
 */
export function normalizeState(raw: unknown): AppState {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") {
    return base;
  }

  const data = raw as Partial<AppState>;

  const coins =
    typeof data.coins === "number" && Number.isFinite(data.coins)
      ? Math.max(0, Math.floor(data.coins))
      : base.coins;

  const win = data.window;

  return {
    ...base,
    version: STATE_VERSION,
    coins,
    window: {
      width: isPositiveNumber(win?.width) ? win.width : base.window.width,
      height: isPositiveNumber(win?.height) ? win.height : base.window.height,
      x: isFiniteNumber(win?.x) ? win.x : null,
      y: isFiniteNumber(win?.y) ? win.y : null,
    },
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}
