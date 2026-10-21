import { load, type Store } from "@tauri-apps/plugin-store";
import type { GameState } from "./types";

/**
 * Saving and loading game state.
 *
 * This is the only file that talks to Tauri, which keeps the game rules in
 * game.ts completely independent of the app framework.
 */

const STORE_FILE = "pet-todo.json";
const STATE_KEY = "game-state";

/**
 * Bump this whenever the shape of `GameState` changes. `loadState` then knows
 * the save on disk is from an older version and can migrate or discard it.
 */
export const STATE_VERSION = 1;

let store: Store | null = null;

async function getStore(): Promise<Store> {
  // `autoSave` writes the file shortly after every change, so we rarely have
  // to think about saving manually. `saveState` still forces an immediate
  // write, which is what we want right before the app closes.
  store ??= await load(STORE_FILE, { autoSave: 500 });
  return store;
}

/** Read the saved game, or null if this is a fresh install. */
export async function loadState(): Promise<GameState | null> {
  const s = await getStore();
  const saved = await s.get<GameState>(STATE_KEY);

  if (!saved) {
    return null;
  }

  if (saved.version !== STATE_VERSION) {
    // TODO: migrate old saves here instead of throwing them away.
    console.warn(
      `Saved game is version ${saved.version}, expected ${STATE_VERSION}. Starting fresh.`,
    );
    return null;
  }

  return saved;
}

/** Write the game to disk. */
export async function saveState(state: GameState): Promise<void> {
  const s = await getStore();
  await s.set(STATE_KEY, state);
  await s.save();
}
