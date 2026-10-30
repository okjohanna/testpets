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
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { loadState, saveState } from "./storage";
import { bindEvents, render, showToast, type Page, type UiHandlers } from "./ui";
import type { AppState, PetId } from "./types";
import { syncPetWindow } from "./petWindow";
import { applySizes } from "./sizes";
import { createTray } from "./tray";
import {
  applyWindowSettings,
  placeBottomRight,
  watchWindow,
} from "./window";

/** Quit the whole app, including every pet window. */
function quitAll(): void {
  void invoke("quit_app").catch(() => {
    // Fallback if the Rust command isn't available for some reason.
    void getCurrentWindow().close();
  });
}

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

  // Window sizes live in sizes.ts; publish them to the stylesheet.
  applySizes();

  // The notebook is always on top only when it was left that way.
  await getCurrentWindow().setAlwaysOnTop(state.window.alwaysOnTop === true);

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

  // Ctrl+Q quits the entire app from anywhere in the notebook.
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "q") {
      event.preventDefault();
      quitAll();
    }
  });

  // Closing the main window quits everything, including pet windows.
  await getCurrentWindow().onCloseRequested((event) => {
    event.preventDefault();
    quitAll();
  });

  // 6. The tray icon is the way back to a hidden notebook. Its menu also
  //    toggles always-on-top, which is saved like the window position.
  await createTray({
    alwaysOnTop: state.window.alwaysOnTop === true,
    onAlwaysOnTopChange: (alwaysOnTop) => {
      state = { ...state, window: { ...state.window, alwaysOnTop } };
      void saveState(state);
      void getCurrentWindow().setAlwaysOnTop(alwaysOnTop);
    },
    onQuit: quitAll,
  });
}

void boot().catch((error: unknown) => {
  console.error("Failed to start Pet Todo:", error);
  const banner = document.createElement("p");
  banner.className = "startup-error";
  banner.textContent = `Something went wrong while starting up: ${String(error)}`;
  document.body.prepend(banner);
});
