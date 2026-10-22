import { describe, expect, it } from "vitest";
import {
  addTask,
  COINS_PER_TASK,
  createInitialState,
  deleteTask,
  moveTask,
  normalizeState,
  pickActivePet,
  reorderTasks,
  toggleTask,
  unlockPet,
} from "./game";
import { PET_BY_ID } from "./pets";
import type { AppState, Task } from "./types";

/** A fresh state with a few fields changed, for the pet tests. */
function stateWith(over: Partial<AppState> = {}): AppState {
  return { ...createInitialState(), ...over };
}

/** A task for the tests, without needing a whole state around it. */
function task(id: string, over: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    done: false,
    rewarded: false,
    createdAt: 0,
    ...over,
  };
}

/** A state with one task in it. */
function stateWithTask(): { state: ReturnType<typeof createInitialState>; id: string } {
  const added = addTask(createInitialState(), "Water the plants");
  return { state: added.state, id: added.state.tasks[0].id };
}

describe("coins", () => {
  it("pays out when a task is finished", () => {
    const { state, id } = stateWithTask();
    expect(state.coins).toBe(0);

    const done = toggleTask(state, id);

    expect(done.state.coins).toBe(COINS_PER_TASK);
    expect(done.state.tasks[0].done).toBe(true);
  });

  it("never pays out twice for the same task", () => {
    const { state, id } = stateWithTask();

    const first = toggleTask(state, id);
    const reopened = toggleTask(first.state, id);
    const second = toggleTask(reopened.state, id);

    expect(second.state.coins).toBe(COINS_PER_TASK);
  });

  it("keeps the reward when a task is reopened", () => {
    const { state, id } = stateWithTask();

    const first = toggleTask(state, id);
    const reopened = toggleTask(first.state, id);

    expect(reopened.state.coins).toBe(COINS_PER_TASK);
    expect(reopened.state.tasks[0].rewarded).toBe(true);
    expect(reopened.state.tasks[0].done).toBe(false);
  });

  it("pays out for every task separately", () => {
    let state = createInitialState();
    const first = addTask(state, "One");
    state = first.state;
    const second = addTask(state, "Two");
    state = second.state;

    state = toggleTask(state, state.tasks[0].id).state;
    state = toggleTask(state, state.tasks[1].id).state;

    expect(state.coins).toBe(COINS_PER_TASK * 2);
  });
});

describe("tasks", () => {
  it("refuses a task without a name", () => {
    const state = createInitialState();
    const result = addTask(state, "   ");

    expect(result.state.tasks).toHaveLength(0);
    expect(result.event.tone).toBe("bad");
  });

  it("deletes a task", () => {
    const { state, id } = stateWithTask();

    const result = deleteTask(state, id);

    expect(result.state.tasks).toHaveLength(0);
  });

  it("moves a task to the slot of the target task", () => {
    const tasks = [task("a"), task("b"), task("c")];

    expect(reorderTasks(tasks, "a", "c").map((t) => t.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(reorderTasks(tasks, "c", "a").map((t) => t.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("keeps the list when a task is unknown", () => {
    const tasks = [task("a"), task("b")];

    expect(reorderTasks(tasks, "a", "nope")).toBe(tasks);
    expect(reorderTasks(tasks, "a", "a")).toBe(tasks);
  });

  it("keeps the new order in the state", () => {
    const state = {
      ...createInitialState(),
      tasks: [task("a"), task("b"), task("c")],
    };

    const result = moveTask(state, "a", "c");

    expect(result.state.tasks.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
});

describe("loading a save", () => {
  it("keeps a good save", () => {
    const state = {
      ...createInitialState(),
      coins: 12,
      tasks: [task("a", { done: true, rewarded: true })],
    };

    const loaded = normalizeState(state);

    expect(loaded.coins).toBe(12);
    expect(loaded.tasks).toHaveLength(1);
    expect(loaded.tasks[0].rewarded).toBe(true);
  });

  it("throws away broken tasks", () => {
    const loaded = normalizeState({
      coins: 5,
      tasks: [{ id: "a", title: "Real task" }, { title: "no id" }, null, 7],
    });

    expect(loaded.tasks).toHaveLength(1);
    expect(loaded.tasks[0].title).toBe("Real task");
  });

  it("treats a finished task as already paid", () => {
    const loaded = normalizeState({
      tasks: [{ id: "a", title: "Old task", done: true }],
    });

    expect(loaded.tasks[0].rewarded).toBe(true);
  });

  it("keeps the saved position and drops the old size", () => {
    const loaded = normalizeState({
      window: { x: 40, y: 50, width: 300, height: 400 },
    });

    expect(loaded.window).toEqual({ x: 40, y: 50 });
  });

  it("forgets a position that is not a number", () => {
    const loaded = normalizeState({ window: { x: "left", y: 50 } });

    expect(loaded.window).toEqual({ x: null, y: 50 });
  });

  it("falls back to a fresh state for rubbish", () => {
    expect(normalizeState(null).coins).toBe(0);
    expect(normalizeState("nope").tasks).toHaveLength(0);
  });
});

describe("unlocking a pet", () => {
  it("refuses when the player cannot afford it", () => {
    const state = stateWith({ coins: PET_BY_ID.cat.price - 1 });

    const result = unlockPet(state, "cat");

    expect(result.state).toBe(state);
    expect(result.state.coins).toBe(PET_BY_ID.cat.price - 1);
    expect(result.state.unlockedPets).toEqual([]);
    expect(result.event.tone).toBe("bad");
  });

  it("unlocks the pet and deducts its price", () => {
    const state = stateWith({ coins: PET_BY_ID.cat.price + 7 });

    const result = unlockPet(state, "cat");

    expect(result.state.coins).toBe(7);
    expect(result.state.unlockedPets).toEqual(["cat"]);
    expect(result.event.tone).toBe("good");
  });

  it("can spend exactly the price", () => {
    const state = stateWith({ coins: PET_BY_ID.dog.price });

    const result = unlockPet(state, "dog");

    expect(result.state.coins).toBe(0);
    expect(result.state.unlockedPets).toContain("dog");
  });

  it("does not charge twice for a pet that is already unlocked", () => {
    const state = stateWith({ coins: 50, unlockedPets: ["cat"] });

    const result = unlockPet(state, "cat");

    expect(result.state).toBe(state);
    expect(result.state.coins).toBe(50);
    expect(result.state.unlockedPets).toEqual(["cat"]);
    expect(result.event.tone).toBe("info");
  });
});

describe("picking the active pet", () => {
  it("refuses a pet that is still locked", () => {
    const state = stateWith();

    const result = pickActivePet(state, "cat");

    expect(result.state).toBe(state);
    expect(result.state.activePetId).toBeNull();
    expect(result.event.tone).toBe("bad");
  });

  it("replaces the active pet with another unlocked pet", () => {
    const state = stateWith({
      unlockedPets: ["cat", "dog"],
      activePetId: "cat",
    });

    const result = pickActivePet(state, "dog");

    expect(result.state.activePetId).toBe("dog");
    // Picking a new pet does not lock or unlock anything.
    expect(result.state.unlockedPets).toEqual(["cat", "dog"]);
    expect(result.event.tone).toBe("good");
  });
});

describe("loading saved pets", () => {
  it("drops pet ids it does not know", () => {
    const loaded = normalizeState({
      unlockedPets: ["cat", "unicorn", 7, null],
      activePetId: "unicorn",
    });

    expect(loaded.unlockedPets).toEqual(["cat"]);
    expect(loaded.activePetId).toBeNull();
  });

  it("clears an active pet that is not unlocked", () => {
    const loaded = normalizeState({
      unlockedPets: ["cat"],
      activePetId: "dog",
    });

    expect(loaded.activePetId).toBeNull();
  });

  it("keeps an active pet that is unlocked", () => {
    const loaded = normalizeState({
      unlockedPets: ["cat", "dog"],
      activePetId: "dog",
    });

    expect(loaded.activePetId).toBe("dog");
  });
});
