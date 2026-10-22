import type { AppEvent, AppState } from "./types";

/**
 * Everything that touches the DOM lives here.
 *
 * The rest of the app never builds HTML directly - it calls `render` with the
 * current state and this module decides what that looks like.
 */

/** The two pages of the notebook. */
export type Page = "tasks" | "pets";

export interface UiHandlers {
  onPageChange: (page: Page) => void;
}

/** The page that is on screen right now. */
let currentPage: Page = "tasks";

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return el;
}

/** The page that is not currently open. */
export function otherPage(page: Page): Page {
  return page === "tasks" ? "pets" : "tasks";
}

/** Draw the whole UI from the given state. */
export function render(state: AppState, page: Page): void {
  currentPage = page;

  mustFind<HTMLElement>("#coins").textContent = String(state.coins);

  mustFind<HTMLElement>("#page-tasks").hidden = page !== "tasks";
  mustFind<HTMLElement>("#page-pets").hidden = page !== "pets";

  const toggle = mustFind<HTMLButtonElement>("#page-toggle");
  const next = otherPage(page);
  toggle.textContent = next === "pets" ? "Pets" : "Tasks";
  toggle.setAttribute("aria-label", `Switch to the ${next} page`);
}

let toastTimer: number | undefined;

/** Show a short message in the corner of the window. */
export function showToast(event: AppEvent): void {
  const toast = mustFind<HTMLElement>("#toast");
  toast.textContent = event.message;
  toast.className = `toast show ${event.tone}`;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.className = "toast";
  }, 3200);
}

/** Attach the event listeners. Called once at startup. */
export function bindEvents(handlers: UiHandlers): void {
  const toggle = mustFind<HTMLButtonElement>("#page-toggle");
  toggle.addEventListener("click", () => {
    handlers.onPageChange(otherPage(currentPage));
  });
}
