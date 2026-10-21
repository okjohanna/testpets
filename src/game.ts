import { SPECIES } from "./pets";
import type { Difficulty, GameEvent, GameState, Pet, Todo } from "./types";

/**
 * All the game rules live here.
 *
 * Nothing in this file touches the DOM or Tauri - every function takes a
 * `GameState` and returns a *new* state. That makes the rules easy to read,
 * easy to unit test, and impossible to break by accident from the UI layer.
 */

/** Every stat is clamped to this range. */
export const STAT_MAX = 100;

/** Milliseconds it takes for a pet to lose one point of hunger. */
const HUNGER_DECAY_MS = 30 * 60 * 1000;
/** Milliseconds it takes for a pet to lose one point of happiness. */
const HAPPINESS_DECAY_MS = 45 * 60 * 1000;
/** Milliseconds it takes for a pet to regain one point of energy. */
const ENERGY_REGEN_MS = 20 * 60 * 1000;

export const COSTS = {
  feed: 5,
  play: 8,
} as const;

export const DIFFICULTIES: Record<
  Difficulty,
  { label: string; xp: number; coins: number }
> = {
  easy: { label: "Easy", xp: 5, coins: 1 },
  normal: { label: "Normal", xp: 12, coins: 3 },
  hard: { label: "Hard", xp: 25, coins: 6 },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];

const STARTER_COINS = 20;

function clamp(value: number, min = 0, max = STAT_MAX): number {
  return Math.min(max, Math.max(min, value));
}

/** A short unique id. `crypto.randomUUID` is available in the WebView. */
export function newId(): string {
  return crypto.randomUUID();
}

/** XP needed to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return 50 * level;
}

export function createPet(
  name: string,
  species: Pet["species"],
  now = Date.now(),
): Pet {
  return {
    id: newId(),
    name,
    species,
    level: 1,
    xp: 0,
    hunger: 70,
    happiness: 70,
    energy: 80,
    lastTick: now,
  };
}

export function createInitialState(now = Date.now()): GameState {
  const pet = createPet("Mittens", "cat", now);
  return {
    version: 1,
    coins: STARTER_COINS,
    activePetId: pet.id,
    pets: [pet],
    todos: [],
  };
}

/**
 * Work out how much a pet's stats changed while time passed.
 *
 * We store `lastTick` instead of ticking on a timer, so closing the app for
 * three hours gives the same result as leaving it open for three hours.
 */
export function applyTimeDecay(pet: Pet, now = Date.now()): Pet {
  const info = SPECIES[pet.species];
  const elapsed = Math.max(0, now - pet.lastTick);

  const hungerLoss = Math.floor((elapsed / HUNGER_DECAY_MS) * info.hungerRate);
  const happinessLoss = Math.floor(
    (elapsed / HAPPINESS_DECAY_MS) * info.happinessRate,
  );
  const energyGain = Math.floor(elapsed / ENERGY_REGEN_MS);

  return {
    ...pet,
    hunger: clamp(pet.hunger - hungerLoss),
    happiness: clamp(pet.happiness - happinessLoss),
    energy: clamp(pet.energy + energyGain),
    lastTick: now,
  };
}

/** Apply decay to every pet in the state. */
export function tickAll(state: GameState, now = Date.now()): GameState {
  return {
    ...state,
    pets: state.pets.map((pet) => applyTimeDecay(pet, now)),
  };
}

/**
 * Give a pet XP and work out whether it levelled up.
 *
 * A pet can gain several levels from one big reward, so this loops until the
 * XP is not enough for another level.
 */
export function addXp(
  pet: Pet,
  amount: number,
): { pet: Pet; leveledUp: boolean } {
  let level = pet.level;
  let xp = pet.xp + amount;
  let leveledUp = false;

  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  return { pet: { ...pet, level, xp }, leveledUp };
}

/** A generic "this worked / this didn't" result. */
export interface StateChange {
  state: GameState;
  event: GameEvent;
}

function replacePet(state: GameState, pet: Pet): GameState {
  return {
    ...state,
    pets: state.pets.map((p) => (p.id === pet.id ? pet : p)),
  };
}

function findPet(state: GameState, petId: string): Pet | undefined {
  return state.pets.find((p) => p.id === petId);
}

export function selectPet(
  state: GameState,
  petId: string,
): StateChange {
  if (!findPet(state, petId)) {
    return { state, event: { tone: "bad", message: "No such pet." } };
  }
  return {
    state: { ...state, activePetId: petId },
    event: { tone: "info", message: "Active pet changed." },
  };
}

export function feedPet(state: GameState, petId: string): StateChange {
  const pet = findPet(state, petId);
  if (!pet) {
    return { state, event: { tone: "bad", message: "No such pet." } };
  }
  if (state.coins < COSTS.feed) {
    return {
      state,
      event: { tone: "bad", message: "Not enough coins. Finish a task!" },
    };
  }
  if (pet.hunger >= STAT_MAX) {
    return {
      state,
      event: { tone: "info", message: `${pet.name} is completely full.` },
    };
  }

  const updated: Pet = {
    ...pet,
    hunger: clamp(pet.hunger + 30),
    happiness: clamp(pet.happiness + 5),
    lastTick: Date.now(),
  };

  return {
    state: {
      ...replacePet(state, updated),
      coins: state.coins - COSTS.feed,
    },
    event: {
      tone: "good",
      message: `${pet.name} enjoyed the snack. -${COSTS.feed} coins.`,
    },
  };
}

export function petPet(state: GameState, petId: string): StateChange {
  const pet = findPet(state, petId);
  if (!pet) {
    return { state, event: { tone: "bad", message: "No such pet." } };
  }
  if (pet.energy < 10) {
    return {
      state,
      event: { tone: "bad", message: `${pet.name} is too tired to play.` },
    };
  }

  const updated: Pet = {
    ...pet,
    happiness: clamp(pet.happiness + 15),
    energy: clamp(pet.energy - 2),
    lastTick: Date.now(),
  };

  return {
    state: replacePet(state, updated),
    event: { tone: "good", message: `${pet.name} loves the attention.` },
  };
}

export function playWithPet(state: GameState, petId: string): StateChange {
  const pet = findPet(state, petId);
  if (!pet) {
    return { state, event: { tone: "bad", message: "No such pet." } };
  }
  if (state.coins < COSTS.play) {
    return {
      state,
      event: { tone: "bad", message: "Not enough coins. Finish a task!" },
    };
  }
  if (pet.energy < 20) {
    return {
      state,
      event: { tone: "bad", message: `${pet.name} is exhausted. Let it rest.` },
    };
  }

  const updated: Pet = {
    ...pet,
    happiness: clamp(pet.happiness + 25),
    energy: clamp(pet.energy - 15),
    hunger: clamp(pet.hunger - 5),
    lastTick: Date.now(),
  };

  return {
    state: {
      ...replacePet(state, updated),
      coins: state.coins - COSTS.play,
    },
    event: {
      tone: "good",
      message: `${pet.name} had a great time. -${COSTS.play} coins.`,
    },
  };
}

export function addTodo(
  state: GameState,
  title: string,
  difficulty: Difficulty = "normal",
): StateChange {
  const trimmed = title.trim();
  if (!trimmed) {
    return { state, event: { tone: "bad", message: "Give the task a name." } };
  }

  const todo: Todo = {
    id: newId(),
    title: trimmed,
    done: false,
    difficulty,
    createdAt: Date.now(),
    completedAt: null,
  };

  return {
    state: { ...state, todos: [todo, ...state.todos] },
    event: { tone: "good", message: "Task added." },
  };
}

export function removeTodo(state: GameState, todoId: string): StateChange {
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) {
    return { state, event: { tone: "bad", message: "No such task." } };
  }
  return {
    state: { ...state, todos: state.todos.filter((t) => t.id !== todoId) },
    event: { tone: "info", message: "Task removed." },
  };
}

/**
 * Mark a task as done and pay out the reward.
 *
 * The reward goes to the active pet, which is why `activePetId` exists.
 */
export function completeTodo(
  state: GameState,
  todoId: string,
): StateChange {
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) {
    return { state, event: { tone: "bad", message: "No such task." } };
  }
  if (todo.done) {
    return {
      state,
      event: { tone: "info", message: "That task is already done." },
    };
  }

  const reward = DIFFICULTIES[todo.difficulty];

  let next: GameState = {
    ...state,
    coins: state.coins + reward.coins,
    todos: state.todos.map((t) =>
      t.id === todoId ? { ...t, done: true, completedAt: Date.now() } : t,
    ),
  };

  let message = `Task complete! +${reward.xp} XP, +${reward.coins} coins.`;

  const active = next.pets.find((p) => p.id === next.activePetId);
  if (active) {
    const result = addXp(active, reward.xp);
    next = replacePet(next, result.pet);
    if (result.leveledUp) {
      message += ` ${active.name} reached level ${result.pet.level}!`;
    }
  }

  return { state: next, event: { tone: "good", message } };
}

/** Un-complete a task. No rewards are taken back - be generous. */
export function reopenTodo(state: GameState, todoId: string): StateChange {
  if (!state.todos.some((t) => t.id === todoId)) {
    return { state, event: { tone: "bad", message: "No such task." } };
  }
  return {
    state: {
      ...state,
      todos: state.todos.map((t) =>
        t.id === todoId ? { ...t, done: false, completedAt: null } : t,
      ),
    },
    event: { tone: "info", message: "Task reopened." },
  };
}
