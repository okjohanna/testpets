/**
 * The shapes of everything the app stores.
 *
 * These types describe data that gets written to disk, so treat them carefully:
 * if you change one, bump `STATE_VERSION` in game.ts so old saves can be
 * migrated instead of silently breaking.
 */

/** Every pet the player can own. */
export type PetId = "cat" | "dog" | "rabbit" | "fox" | "dragon" | "owl";

/** One line on the to-do page. */
export interface Task {
  id: string;
  title: string;
  /** Done tasks are crossed out. */
  done: boolean;
  /**
   * True once the coin reward for this task has been paid out.
   *
   * Un-checking and re-checking a task must not pay out a second time, so
   * this flag stays true for the rest of the task's life.
   */
  rewarded: boolean;
  /** Epoch milliseconds, for sorting and for the "newest first" default. */
  createdAt: number;
}

/** A pet in the shop. Art is either a sprite or the placeholder colour. */
export interface PetDefinition {
  id: PetId;
  name: string;
  /** Fallback colour for pets that do not have a sprite yet. */
  color: string;
  /** Bundled sprite URL. Omitted while a pet still uses the colour square. */
  sprite?: string;
  /** How many coins it costs to unlock this pet. */
  price: number;
}

/**
 * Where the notebook window was left, so it comes back in the same place.
 *
 * The notebook has a fixed size, so only its position is stored.
 */
export interface WindowSettings {
  /** Null until the player has moved the window. */
  x: number | null;
  y: number | null;
}

/** Everything the app keeps between restarts. */
export interface AppState {
  /** Shape version, see STATE_VERSION in game.ts. */
  version: number;
  /** The wallet. Spent on unlocking pets. */
  coins: number;
  /** Tasks in the order the player arranged them. */
  tasks: Task[];
  /** The pets the player has already paid for. */
  unlockedPets: PetId[];
  /** The pet that roams the desktop. Null until a pet is picked. */
  activePetId: PetId | null;
  window: WindowSettings;
}

/** A short message shown to the player after an action. */
export interface AppEvent {
  message: string;
  tone: "good" | "bad" | "info";
}
