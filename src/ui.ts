import { COINS_PER_TASK } from "./game";
import { PET_CATALOG } from "./pets";
import type { AppEvent, AppState, PetId, Task } from "./types";

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
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTask: (draggedId: string, targetId: string) => void;
  onUnlockPet: (petId: PetId) => void;
  onPickActivePet: (petId: PetId) => void;
}

/** The page that is on screen right now. */
let currentPage: Page = "tasks";

/** The task that is being dragged around, if any. */
let draggedId: string | null = null;

/** The task the dragged task would be dropped on. */
let dropTarget: HTMLElement | null = null;

/**
 * Escape text before putting it into HTML.
 *
 * Task titles are typed by the user, so they must never be able to inject
 * markup. Always use this for anything the player controls.
 */
function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

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

/** One line on the to-do page. */
function taskItem(task: Task): string {
  return `
    <li class="task${task.done ? " is-done" : ""}" draggable="true" data-task-id="${task.id}">
      <label class="task-main">
        <input type="checkbox" data-role="toggle" ${task.done ? "checked" : ""} />
        <span class="task-title">${escapeHtml(task.title)}</span>
      </label>
      <span class="task-reward" title="Coins for finishing this task">+${COINS_PER_TASK}</span>
      <button type="button" class="task-delete" data-role="delete" aria-label="Delete task">&#10005;</button>
    </li>`;
}

/** One card in the pets grid. */
function petCard(state: AppState, petId: PetId): string {
  const pet = PET_CATALOG.find((p) => p.id === petId)!;
  const unlocked = state.unlockedPets.includes(petId);
  const active = state.activePetId === petId;

  if (!unlocked) {
    return `
      <button type="button" class="pet-card pet-card-locked" data-action="unlock" data-pet-id="${pet.id}" style="--pet-color: ${pet.color}">
        <span class="pet-swatch" aria-hidden="true"></span>
        <span class="pet-name">${escapeHtml(pet.name)}</span>
        <span class="pet-price"><span class="coin" aria-hidden="true"></span>${pet.price}</span>
      </button>`;
  }

  if (active) {
    return `
      <div class="pet-card pet-card-active" data-pet-id="${pet.id}" style="--pet-color: ${pet.color}">
        <span class="pet-swatch" aria-hidden="true"></span>
        <span class="pet-name">${escapeHtml(pet.name)}</span>
        <span class="pet-badge">Active</span>
      </div>`;
  }

  return `
    <button type="button" class="pet-card pet-card-unlocked" data-action="pick" data-pet-id="${pet.id}" style="--pet-color: ${pet.color}">
      <span class="pet-swatch" aria-hidden="true"></span>
      <span class="pet-name">${escapeHtml(pet.name)}</span>
      <span class="pet-pick">Pick</span>
    </button>`;
}

/** Draw the whole UI from the given state. */
export function render(state: AppState, page: Page): void {
  currentPage = page;

  mustFind<HTMLElement>("#coins").textContent = String(state.coins);

  mustFind<HTMLElement>("#page-tasks").hidden = page !== "tasks";
  mustFind<HTMLElement>("#page-pets").hidden = page !== "pets";

  mustFind<HTMLElement>("#task-list").innerHTML = state.tasks
    .map(taskItem)
    .join("");
  mustFind<HTMLElement>("#empty-tasks").hidden = state.tasks.length > 0;

  mustFind<HTMLElement>("#pet-grid").innerHTML = PET_CATALOG.map((pet) =>
    petCard(state, pet.id),
  ).join("");
  mustFind<HTMLElement>("#empty-pets").hidden = PET_CATALOG.length > 0;

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

/** Highlight the task the dragged task would be dropped on. */
function setDropTarget(item: HTMLElement | null): void {
  if (dropTarget === item) return;
  dropTarget?.classList.remove("is-drop-target");
  dropTarget = item;
  dropTarget?.classList.add("is-drop-target");
}

/** Forget everything about the drag that is going on. */
function endDrag(list: HTMLElement): void {
  draggedId = null;
  setDropTarget(null);
  list.querySelectorAll(".is-dragging").forEach((el) => {
    el.classList.remove("is-dragging");
  });
}

/** Attach the event listeners. Called once at startup. */
export function bindEvents(handlers: UiHandlers): void {
  const toggle = mustFind<HTMLButtonElement>("#page-toggle");
  toggle.addEventListener("click", () => {
    handlers.onPageChange(otherPage(currentPage));
  });

  const petGrid = mustFind<HTMLElement>("#pet-grid");

  petGrid.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const card = target.closest<HTMLElement>("[data-pet-id]");
    if (!card) return;
    const petId = card.dataset.petId as PetId;

    if (target.closest("[data-action='unlock']")) {
      handlers.onUnlockPet(petId);
      return;
    }
    if (target.closest("[data-action='pick']")) {
      handlers.onPickActivePet(petId);
    }
  });

  const form = mustFind<HTMLFormElement>("#task-form");
  const input = mustFind<HTMLInputElement>("#task-input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onAddTask(input.value);
    input.value = "";
    input.focus();
  });

  const list = mustFind<HTMLElement>("#task-list");

  list.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.role !== "toggle") return;
    const item = target.closest<HTMLElement>("[data-task-id]");
    if (!item) return;
    handlers.onToggleTask(item.dataset.taskId!);
  });

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.dataset.role !== "delete") return;
    const item = target.closest<HTMLElement>("[data-task-id]");
    if (!item) return;
    handlers.onDeleteTask(item.dataset.taskId!);
  });

  // Drag and drop, so the player can put the tasks in the order they want.
  list.addEventListener("dragstart", (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-task-id]",
    );
    if (!item) return;

    draggedId = item.dataset.taskId ?? null;
    item.classList.add("is-dragging");

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      // Firefox refuses to start a drag without any data.
      event.dataTransfer.setData("text/plain", draggedId ?? "");
    }
  });

  list.addEventListener("dragover", (event) => {
    if (!draggedId) return;
    // Without this the drop is not allowed.
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";

    const item = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-task-id]",
    );
    setDropTarget(item ?? null);
  });

  list.addEventListener("drop", (event) => {
    event.preventDefault();

    const item = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-task-id]",
    );
    const targetId = item?.dataset.taskId ?? null;
    const from = draggedId;

    endDrag(list);

    if (from && targetId && from !== targetId) {
      handlers.onReorderTask(from, targetId);
    }
  });

  list.addEventListener("dragend", () => {
    endDrag(list);
  });
}
