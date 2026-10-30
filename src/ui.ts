import { COINS_PER_TASK } from "./game";
import { PET_CATALOG } from "./pets";
import type { AppEvent, AppState, PetDefinition, PetId, Task } from "./types";
import gadgetShell from "./assets/gadget/Shell.png";
import notebookBackground from "./assets/gadget/Screen.png";
import shopButton from "./assets/gadget/Btn_Shop.png";
import petsButton from "./assets/gadget/Btn_Pets.png";
import tasksButton from "./assets/gadget/Btn_Round.png";
import nextButton from "./assets/gadget/Btn_Aux_Right.png";
import previousButton from "./assets/gadget/Btn_Aux_Left.png";

/**
 * Everything that touches the DOM lives here.
 *
 * The rest of the app never builds HTML directly - it calls `render` with the
 * current state and this module decides what that looks like.
 */

/** The view shown on the notebook screen. */
export type Page = "tasks" | "shop" | "pets";

const TASKS_PER_PAGE = 4;

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
let taskPageIndex = 0;

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

/** A pet's artwork: its sprite, or a coloured square as a fallback. */
function petArt(pet: PetDefinition): string {
  if (pet.sprite) {
    return `<img class="pet-sprite" src="${escapeHtml(pet.sprite)}" alt="" aria-hidden="true" />`;
  }
  return `<span class="pet-swatch" aria-hidden="true"></span>`;
}

/** One card in the pets grid. */
function petCard(state: AppState, petId: PetId): string {
  const pet = PET_CATALOG.find((p) => p.id === petId)!;
  const unlocked = state.unlockedPets.includes(petId);
  const active = state.activePetId === petId;

  if (!unlocked) {
    return `
      <button type="button" class="pet-card pet-card-locked" data-action="unlock" data-pet-id="${pet.id}" style="--pet-color: ${pet.color}">
        ${petArt(pet)}
        <span class="pet-name">${escapeHtml(pet.name)}</span>
        <span class="pet-price"><span class="coin" aria-hidden="true"></span>${pet.price}</span>
      </button>`;
  }

  if (active) {
    return `
      <div class="pet-card pet-card-active" data-pet-id="${pet.id}" style="--pet-color: ${pet.color}">
        ${petArt(pet)}
        <span class="pet-name">${escapeHtml(pet.name)}</span>
        <span class="pet-badge">Active</span>
      </div>`;
  }

  return `
    <button type="button" class="pet-card pet-card-unlocked" data-action="pick" data-pet-id="${pet.id}" style="--pet-color: ${pet.color}">
      ${petArt(pet)}
      <span class="pet-name">${escapeHtml(pet.name)}</span>
      <span class="pet-pick">Pick</span>
    </button>`;
}

/** Draw the whole UI from the given state. */
export function render(state: AppState, page: Page): void {
  currentPage = page;

  mustFind<HTMLImageElement>("#gadget-shell").src = gadgetShell;
  mustFind<HTMLImageElement>("#notebook-background").src = notebookBackground;
  const buttonImages: Record<string, string> = {
    ".button-shop img": shopButton,
    ".button-pets img": petsButton,
    ".button-tasks img": tasksButton,
    ".button-next img": nextButton,
    ".button-previous img": previousButton,
  };
  for (const [selector, source] of Object.entries(buttonImages)) {
    mustFind<HTMLImageElement>(selector).src = source;
  }

  mustFind<HTMLElement>("#coins").textContent = String(state.coins);

  mustFind<HTMLElement>("#page-tasks").hidden = page !== "tasks";
  mustFind<HTMLElement>("#page-shop").hidden = page !== "shop";
  mustFind<HTMLElement>("#page-pets").hidden = page !== "pets";
  mustFind<HTMLElement>("#notebook-title").textContent =
    page[0].toUpperCase() + page.slice(1);

  const taskPageCount = Math.max(1, Math.ceil(state.tasks.length / TASKS_PER_PAGE));
  taskPageIndex = Math.min(taskPageIndex, taskPageCount - 1);
  const firstTaskIndex = taskPageIndex * TASKS_PER_PAGE;
  mustFind<HTMLElement>("#task-list").innerHTML = state.tasks
    .slice(firstTaskIndex, firstTaskIndex + TASKS_PER_PAGE)
    .map(taskItem)
    .join("");
  mustFind<HTMLElement>("#empty-tasks").hidden = state.tasks.length > 0;
  mustFind<HTMLElement>("#task-page-count").textContent =
    `${taskPageIndex + 1} / ${taskPageCount}`;
  mustFind<HTMLButtonElement>("#previous-task-page").disabled =
    page !== "tasks" || taskPageIndex === 0;
  mustFind<HTMLButtonElement>("#next-task-page").disabled =
    page !== "tasks" || taskPageIndex >= taskPageCount - 1;

  document.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((button) => {
    const active = button.dataset.page === page;
    button.setAttribute("aria-pressed", String(active));
  });

  mustFind<HTMLElement>("#pet-grid").innerHTML = PET_CATALOG.map((pet) =>
    petCard(state, pet.id),
  ).join("");
  mustFind<HTMLElement>("#empty-pets").hidden = PET_CATALOG.length > 0;
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
  document.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = button.dataset.page;
      if (nextPage === "tasks" || nextPage === "shop" || nextPage === "pets") {
        handlers.onPageChange(nextPage);
      }
    });
  });

  mustFind<HTMLButtonElement>("#previous-task-page").addEventListener("click", () => {
    if (currentPage !== "tasks" || taskPageIndex === 0) return;
    taskPageIndex -= 1;
    handlers.onPageChange("tasks");
  });
  mustFind<HTMLButtonElement>("#next-task-page").addEventListener("click", () => {
    if (currentPage !== "tasks") return;
    taskPageIndex += 1;
    handlers.onPageChange("tasks");
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
