import { isPetId, PET_BY_ID } from "./pets";
import type { AppEvent, AppState, PetId, Task } from "./types";

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

/** How many coins a finished task is worth. */
export const COINS_PER_TASK = 5;

/** A result: the new state plus a short message for the player. */
export interface StateChange {
  state: AppState;
  event: AppEvent;
}

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

  const tasks = Array.isArray(data.tasks)
    ? data.tasks.map(normalizeTask).filter((task): task is Task => task !== null)
    : [];

  const unlockedPets = Array.isArray(data.unlockedPets)
    ? data.unlockedPets.filter(isPetId)
    : [];

  const activePetId =
    isPetId(data.activePetId) && unlockedPets.includes(data.activePetId)
      ? data.activePetId
      : null;

  const win = data.window;

  return {
    ...base,
    version: STATE_VERSION,
    coins,
    tasks,
    unlockedPets,
    activePetId,
    window: {
      width: isPositiveNumber(win?.width) ? win.width : base.window.width,
      height: isPositiveNumber(win?.height) ? win.height : base.window.height,
      x: isFiniteNumber(win?.x) ? win.x : null,
      y: isFiniteNumber(win?.y) ? win.y : null,
    },
  };
}

/**
 * Check one task from a save file.
 *
 * Returns null for anything that is not a usable task, so a half written
 * save file cannot take the app down.
 */
function normalizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;

  const task = raw as Partial<Task>;
  if (typeof task.id !== "string" || task.id === "") return null;
  if (typeof task.title !== "string" || task.title.trim() === "") return null;

  const done = task.done === true;

  return {
    id: task.id,
    title: task.title.trim(),
    done,
    // A task that was already finished when the save was written has been
    // paid for, even if that old save did not have the flag.
    rewarded: typeof task.rewarded === "boolean" ? task.rewarded : done,
    createdAt: isFiniteNumber(task.createdAt) ? task.createdAt : 0,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

/* ------------------------------- tasks ------------------------------ */

/** Write a new task at the bottom of the list. */
export function addTask(state: AppState, title: string): StateChange {
  const trimmed = title.trim();
  if (trimmed === "") {
    return { state, event: { tone: "bad", message: "Give the task a name." } };
  }

  const task: Task = {
    id: newId(),
    title: trimmed,
    done: false,
    rewarded: false,
    createdAt: Date.now(),
  };

  return {
    state: { ...state, tasks: [...state.tasks, task] },
    event: { tone: "good", message: "Task added." },
  };
}

/**
 * Tick a task off, or tick it back on.
 *
 * The coins are paid out the first time a task is finished. The `rewarded`
 * flag stays on the task forever, so un-checking and re-checking it never
 * pays out a second time.
 */
export function toggleTask(state: AppState, taskId: string): StateChange {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) {
    return { state, event: { tone: "bad", message: "No such task." } };
  }

  if (task.done) {
    // Un-checking is forgiving: the coins stay in the wallet.
    return {
      state: {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, done: false } : t,
        ),
      },
      event: { tone: "info", message: "Task reopened." },
    };
  }

  const payout = task.rewarded ? 0 : COINS_PER_TASK;

  return {
    state: {
      ...state,
      coins: state.coins + payout,
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, done: true, rewarded: true } : t,
      ),
    },
    event: {
      tone: "good",
      message:
        payout > 0 ? `Task complete! +${payout} coins.` : "Task marked as done.",
    },
  };
}

/** Remove a task for good. */
export function deleteTask(state: AppState, taskId: string): StateChange {
  if (!state.tasks.some((t) => t.id === taskId)) {
    return { state, event: { tone: "bad", message: "No such task." } };
  }

  return {
    state: { ...state, tasks: state.tasks.filter((t) => t.id !== taskId) },
    event: { tone: "info", message: "Task deleted." },
  };
}

/**
 * Move a task to the slot another task is in.
 *
 * The dragged task takes the place of the target task. The list itself is
 * never changed, a new list is returned.
 */
export function reorderTasks(
  tasks: Task[],
  draggedId: string,
  targetId: string,
): Task[] {
  const from = tasks.findIndex((t) => t.id === draggedId);
  const to = tasks.findIndex((t) => t.id === targetId);

  if (from === -1 || to === -1 || from === to) {
    return tasks;
  }

  const next = [...tasks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next;
}

/** Put a task in a new place in the list. */
export function moveTask(
  state: AppState,
  draggedId: string,
  targetId: string,
): StateChange {
  const tasks = reorderTasks(state.tasks, draggedId, targetId);

  if (tasks === state.tasks) {
    return { state, event: { tone: "info", message: "Task stays put." } };
  }

  return {
    state: { ...state, tasks },
    event: { tone: "info", message: "Task moved." },
  };
}

/* ------------------------------- pets ------------------------------- */

/**
 * Spend coins to unlock a pet.
 *
 * A pet can only be unlocked once and only if the player has enough coins.
 */
export function unlockPet(state: AppState, petId: PetId): StateChange {
  const pet = PET_BY_ID[petId];
  if (!pet) {
    return { state, event: { tone: "bad", message: "No such pet." } };
  }
  if (state.unlockedPets.includes(petId)) {
    return {
      state,
      event: { tone: "info", message: `${pet.name} is already unlocked.` },
    };
  }
  if (state.coins < pet.price) {
    return {
      state,
      event: {
        tone: "bad",
        message: `Not enough coins. ${pet.name} costs ${pet.price}.`,
      },
    };
  }

  return {
    state: {
      ...state,
      coins: state.coins - pet.price,
      unlockedPets: [...state.unlockedPets, petId],
    },
    event: {
      tone: "good",
      message: `Unlocked ${pet.name}!`,
    },
  };
}

/**
 * Pick which unlocked pet is the active roaming pet.
 *
 * Picking another pet replaces the current one. The pets page only saves the
 * chosen active pet id - it does not spawn any window.
 */
export function pickActivePet(state: AppState, petId: PetId): StateChange {
  const pet = PET_BY_ID[petId];
  if (!pet) {
    return { state, event: { tone: "bad", message: "No such pet." } };
  }
  if (!state.unlockedPets.includes(petId)) {
    return {
      state,
      event: {
        tone: "bad",
        message: `${pet.name} is locked. Buy it first.`,
      },
    };
  }
  if (state.activePetId === petId) {
    return {
      state,
      event: { tone: "info", message: `${pet.name} is already roaming.` },
    };
  }

  return {
    state: { ...state, activePetId: petId },
    event: { tone: "good", message: `${pet.name} is now roaming.` },
  };
}
