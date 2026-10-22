import {
  addTask,
  createInitialState,
  deleteTask,
  moveTask,
  pickActivePet,
  toggleTask,
  unlockPet,
  type StateChange,
} from "./game";
import { loadState, saveState } from "./storage";
import { bindEvents, render, showToast, type Page, type UiHandlers } from "./ui";
import type { AppState, PetId } from "./types";
import { syncPetWindow } from "./petWindow";
import {
  applyWindowSettings,
  placeBottomRight,
  watchWindow,
} from "./window";

/**
 * The controller. It owns the current state, turns UI events into app
 * actions, and saves the result.
 */

/** The single source of truth for the running app. */
let state: AppState;

/** Which page of the notebook is open. */
let page: Page = "tasks";

/** Apply a change, redraw, and persist. */
function run(change: StateChange): void {
  state = change.state;
  render(state, page);
  showToast(change.event);
  void saveState(state);
}

/** Keep the roaming pet window in sync, without failing the caller. */
function syncRoamingPet(petId: PetId | null): void {
  void syncPetWindow(petId).catch((error) => {
    console.error("Could not open the pet window:", error);
  });
}

async function boot(): Promise<void> {
  // 1. Load the save, or start a brand new notebook.
  state = (await loadState()) ?? createInitialState();

  // 2. Put the notebook back where the player left it. The first time round
  //    it is parked in the bottom-right corner, just above the taskbar.
  if (state.window.x === null || state.window.y === null) {
    await placeBottomRight();
  } else {
    await applyWindowSettings(state.window);
  }

  // 3. Wire up the UI.
  const handlers: UiHandlers = {
    onPageChange: (next) => {
      page = next;
      render(state, page);
    },
    onAddTask: (title) => run(addTask(state, title)),
    onToggleTask: (taskId) => run(toggleTask(state, taskId)),
    onDeleteTask: (taskId) => run(deleteTask(state, taskId)),
    onReorderTask: (draggedId, targetId) => {
      // Reordering is quiet - no toast, the list moving is the feedback.
      state = moveTask(state, draggedId, targetId).state;
      render(state, page);
      void saveState(state);
    },
    onUnlockPet: (petId: PetId) => run(unlockPet(state, petId)),
    onPickActivePet: (petId: PetId) => {
      const change = pickActivePet(state, petId);
      run(change);
      // Picking another pet replaces the one roaming the desktop.
      syncRoamingPet(change.state.activePetId);
    },
  };

  bindEvents(handlers);
  render(state, page);
  await saveState(state);

  // 4. Bring back the roaming pet that was chosen last time, if any.
  syncRoamingPet(state.activePetId);

  // 5. Remember where the player drags the notebook.
  await watchWindow((settings) => {
    state = { ...state, window: settings };
    void saveState(state);
  });
}

void boot().catch((error: unknown) => {
  console.error("Failed to start Pet Todo:", error);
  const banner = document.createElement("p");
  banner.className = "startup-error";
  banner.textContent = `Something went wrong while starting up: ${String(error)}`;
  document.body.prepend(banner);
});
