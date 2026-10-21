/**
 * The shapes of everything the game stores.
 *
 * These types describe data that gets written to disk, so treat them carefully:
 * if you change one, bump `STATE_VERSION` in storage.ts so old saves can be
 * migrated instead of silently breaking.
 */

/** Every pet species the player can own. */
export type Species = "cat" | "dog" | "rabbit" | "dragon";

/** How hard a task is, which decides how much XP it is worth. */
export type Difficulty = "easy" | "normal" | "hard";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  /** Pet levels start at 1. */
  level: number;
  /** XP earned towards the *next* level. */
  xp: number;
  /** 0-100. 100 means completely full. */
  hunger: number;
  /** 0-100. */
  happiness: number;
  /** 0-100. */
  energy: number;
  /**
   * Epoch milliseconds of the last time we recalculated this pet's stats.
   * Stats decay based on how much time has passed since this moment, which is
   * what lets pets keep changing while the app is closed.
   */
  lastTick: number;
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  difficulty: Difficulty;
  createdAt: number;
  /** Epoch milliseconds of completion, or null while the task is open. */
  completedAt: number | null;
}

export interface GameState {
  /** Shape version, see STATE_VERSION in storage.ts. */
  version: number;
  /** Currency used to feed and play with pets. */
  coins: number;
  /** The pet that earns XP from completed tasks. */
  activePetId: string | null;
  pets: Pet[];
  todos: Todo[];
}

/** A short message shown to the player after an action. */
export interface GameEvent {
  message: string;
  tone: "good" | "bad" | "info";
}
