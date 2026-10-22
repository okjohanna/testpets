import { describe, expect, it } from "vitest";
import {
  addTask,
  COINS_PER_TASK,
  createInitialState,
  deleteTask,
  moveTask,
  normalizeState,
  reorderTasks,
  toggleTask,
} from "./game";
import type { Task } from "./types";

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
