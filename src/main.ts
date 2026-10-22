import { createInitialState } from "./game";
import { loadState, saveState } from "./storage";
import { bindEvents, render, type Page, type UiHandlers } from "./ui";
import type { AppState } from "./types";
import { placeBottomRight } from "./window";

/**
 * The controller. It owns the current state, turns UI events into app
 * actions, and saves the result.
 */

/** The single source of truth for the running app. */
let state: AppState;

/** Which page of the notebook is open. */
let page: Page = "tasks";

async function boot(): Promise<void> {
  // 1. Load the save, or start a brand new notebook.
  state = (await loadState()) ?? createInitialState();

  // 2. The notebook is a small widget: park it in the bottom-right corner of
  //    the screen, just above the taskbar.
  await placeBottomRight();

  // 3. Wire up the UI.
  const handlers: UiHandlers = {
    onPageChange: (next) => {
      page = next;
      render(state, page);
    },
  };

  bindEvents(handlers);
  render(state, page);
  await saveState(state);
}

void boot().catch((error: unknown) => {
  console.error("Failed to start Pet Todo:", error);
  const banner = document.createElement("p");
  banner.className = "startup-error";
  banner.textContent = `Something went wrong while starting up: ${String(error)}`;
  document.body.prepend(banner);
});
