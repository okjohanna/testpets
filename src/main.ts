import { invoke } from "@tauri-apps/api/core";
import {
  addTodo,
  completeTodo,
  createInitialState,
  feedPet,
  petPet,
  playWithPet,
  reopenTodo,
  removeTodo,
  selectPet,
  tickAll,
  type StateChange,
} from "./game";
import { loadState, saveState } from "./storage";
import { bindEvents, render, showToast, type UiHandlers } from "./ui";
import type { GameState } from "./types";

/**
 * The controller. It owns the current state, turns UI events into game
 * actions, and saves the result.
 */

/** The single source of truth for the running app. */
let state: GameState;

/** Apply a change, redraw, and persist. */
function run(change: StateChange): void {
  state = change.state;
  render(state);
  showToast(change.event);
  void saveState(state);
}

function petName(petId: string): string {
  return state.pets.find((p) => p.id === petId)?.name ?? "Your pet";
}

/**
 * Petting is the one action that asks the Rust side for a reaction, so the
 * pet's voice lives in Rust instead of in the frontend.
 */
async function petInteraction(petId: string): Promise<void> {
  const change = petPet(state, petId);
  state = change.state;
  render(state);
  void saveState(state);

  const phrase = await invoke<string>("pet_says", { name: petName(petId) });
  showToast({ tone: "good", message: phrase });
}

async function boot(): Promise<void> {
  // 1. Load the save, or start a brand new game.
  const saved = await loadState();
  state = saved ?? createInitialState();

  // 2. Apply any stat decay that happened while the app was closed.
  state = tickAll(state);

  // 3. Wire up the UI.
  const handlers: UiHandlers = {
    onAddTodo: (title, difficulty) => run(addTodo(state, title, difficulty)),
    onToggleTodo: (todoId, done) =>
      run(done ? completeTodo(state, todoId) : reopenTodo(state, todoId)),
    onDeleteTodo: (todoId) => run(removeTodo(state, todoId)),
    onSelectPet: (petId) => run(selectPet(state, petId)),
    onPetAction: (petId, action) => {
      if (action === "pet") {
        void petInteraction(petId);
        return;
      }
      if (action === "feed") {
        run(feedPet(state, petId));
        return;
      }
      run(playWithPet(state, petId));
    },
  };

  bindEvents(handlers);
  render(state);
  await saveState(state);

  // 4. Keep the meters moving while the app is open. The decay maths also
  //    runs on load, so this is only for making the numbers tick over live.
  window.setInterval(() => {
    state = tickAll(state);
    render(state);
    void saveState(state);
  }, 30_000);
}

void boot().catch((error: unknown) => {
  console.error("Failed to start Pet Todo:", error);
  const banner = document.createElement("p");
  banner.className = "startup-error";
  banner.textContent = `Something went wrong while starting up: ${String(error)}`;
  document.body.prepend(banner);
});
