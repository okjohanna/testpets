import { DIFFICULTIES, xpForNextLevel } from "./game";
import { SPECIES } from "./pets";
import type { Difficulty, GameEvent, GameState } from "./types";

/**
 * Everything that touches the DOM lives here.
 *
 * The rest of the app never builds HTML directly - it calls `render` with the
 * current state and this module decides what that looks like.
 */

export type PetAction = "feed" | "pet" | "play";

export interface UiHandlers {
  onAddTodo: (title: string, difficulty: Difficulty) => void;
  onToggleTodo: (todoId: string, done: boolean) => void;
  onDeleteTodo: (todoId: string) => void;
  onSelectPet: (petId: string) => void;
  onPetAction: (petId: string, action: PetAction) => void;
}

/**
 * Escape text before putting it into HTML.
 *
 * Pet names and task titles are typed by the user, so they must never be able
 * to inject markup. Always use this for anything the player controls.
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

function statRow(label: string, kind: string, value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  return `
    <div class="stat-row">
      <span class="stat-name">${label}</span>
      <div class="meter"><div class="meter-fill ${kind}" style="width:${clamped}%"></div></div>
      <span class="stat-num">${clamped}</span>
    </div>`;
}

function petCard(state: GameState, petId: string): string {
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet) {
    return "";
  }

  const info = SPECIES[pet.species];
  const isActive = pet.id === state.activePetId;
  const needed = xpForNextLevel(pet.level);
  const xpPercent = Math.min(100, Math.round((pet.xp / needed) * 100));

  return `
    <article class="pet-card${isActive ? " is-active" : ""}" data-pet-id="${pet.id}" style="--accent: ${info.accent}">
      <div class="pet-head">
        <div class="pet-avatar">${info.emoji}</div>
        <div class="pet-identity">
          <h3>${escapeHtml(pet.name)}</h3>
          <p class="pet-sub">${info.label} &middot; Level ${pet.level}</p>
        </div>
        ${
          isActive
            ? `<span class="badge">Active</span>`
            : `<button class="ghost" data-action="select" data-pet-id="${pet.id}">Make active</button>`
        }
      </div>

      ${statRow("Hunger", "hunger", pet.hunger)}
      ${statRow("Happy", "happiness", pet.happiness)}
      ${statRow("Energy", "energy", pet.energy)}

      <div class="xp-row">
        <div class="meter"><div class="meter-fill xp" style="width:${xpPercent}%"></div></div>
        <span class="xp-label">${pet.xp} / ${needed} XP</span>
      </div>

      <div class="pet-actions">
        <button data-action="feed" data-pet-id="${pet.id}">Feed 🪙5</button>
        <button data-action="pet" data-pet-id="${pet.id}">Pet</button>
        <button data-action="play" data-pet-id="${pet.id}">Play 🪙8</button>
      </div>
    </article>`;
}

function todoItem(todoId: string, title: string, done: boolean, difficulty: Difficulty): string {
  const reward = DIFFICULTIES[difficulty];
  return `
    <li class="todo${done ? " is-done" : ""}" data-todo-id="${todoId}">
      <label class="todo-main">
        <input type="checkbox" data-role="toggle" ${done ? "checked" : ""} />
        <span class="todo-title">${escapeHtml(title)}</span>
        <span class="todo-tag ${difficulty}">${reward.label} &middot; ${reward.xp} XP</span>
      </label>
      <button class="todo-delete" data-role="delete" aria-label="Delete task">✕</button>
    </li>`;
}

/** Draw the whole UI from the given state. */
export function render(state: GameState): void {
  mustFind<HTMLElement>("#coins").textContent = String(state.coins);

  mustFind<HTMLElement>("#pet-list").innerHTML = state.pets
    .map((pet) => petCard(state, pet.id))
    .join("");

  mustFind<HTMLElement>("#todo-list").innerHTML = state.todos
    .map((t) => todoItem(t.id, t.title, t.done, t.difficulty))
    .join("");

  const open = state.todos.filter((t) => !t.done).length;
  mustFind<HTMLElement>("#todo-summary").textContent =
    state.todos.length === 0
      ? ""
      : `${state.todos.length - open} of ${state.todos.length} done`;

  mustFind<HTMLElement>("#empty-todos").hidden = state.todos.length > 0;
}

let toastTimer: number | undefined;

/** Show a short message in the corner of the window. */
export function showToast(event: GameEvent): void {
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
  const form = mustFind<HTMLFormElement>("#todo-form");
  const input = mustFind<HTMLInputElement>("#todo-input");
  const difficulty = mustFind<HTMLSelectElement>("#todo-difficulty");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onAddTodo(input.value, difficulty.value as Difficulty);
    input.value = "";
    input.focus();
  });

  const list = mustFind<HTMLElement>("#todo-list");

  list.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.role !== "toggle") return;
    const item = target.closest<HTMLElement>("[data-todo-id]");
    if (!item) return;
    handlers.onToggleTodo(item.dataset.todoId!, target.checked);
  });

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.dataset.role !== "delete") return;
    const item = target.closest<HTMLElement>("[data-todo-id]");
    if (!item) return;
    handlers.onDeleteTodo(item.dataset.todoId!);
  });

  const petList = mustFind<HTMLElement>("#pet-list");

  petList.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;

    const card = target.closest<HTMLElement>("[data-pet-id]");
    if (!card) return;
    const petId = card.dataset.petId!;

    if (action === "select") {
      handlers.onSelectPet(petId);
      return;
    }
    handlers.onPetAction(petId, action as PetAction);
  });
}
