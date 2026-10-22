import { load, type Store } from "@tauri-apps/plugin-store";
import { normalizeState, STATE_VERSION } from "./game";
import type { AppState } from "./types";

/**
 * Saving and loading app state.
 *
 * This is one of the two files that talks to Tauri, which keeps the app
 * rules in game.ts completely independent of the app framework.
 */

const STORE_FILE = "pet-todo.json";
const STATE_KEY = "app-state";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  // `autoSave` writes the file shortly after every change, so we rarely have
  // to think about saving manually. `saveState` still forces an immediate
  // write, which is what we want right before the app closes.
  store ??= await load(STORE_FILE, { autoSave: 500 });
  return store;
}

/** Read the saved state, or null if this is a fresh install. */
export async function loadState(): Promise<AppState | null> {
  const s = await getStore();
  const raw = await s.get<unknown>(STATE_KEY);

  if (!raw) {
    return null;
  }

  const version = (raw as { version?: number }).version;
  if (version !== STATE_VERSION) {
    // Old saves are normalised rather than thrown away, so a player who
    // updates the app keeps their tasks and coins.
    console.warn(
      `Saved data is version ${String(version)}, expected ${STATE_VERSION}. Migrating.`,
    );
  }

  return normalizeState(raw);
}

/** Write the state to disk. */
export async function saveState(state: AppState): Promise<void> {
  const s = await getStore();
  await s.set(STATE_KEY, state);
  await s.save();
}
