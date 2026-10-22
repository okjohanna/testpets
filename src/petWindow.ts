import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { PetId } from "./types";

/**
 * The roaming pet window.
 *
 * The notebook owns this window: whenever the active pet changes it closes the
 * old pet window and opens a new one. The pet itself (roaming, dragging) lives
 * in pet.ts, inside that separate window.
 */

/** The pet window is a small square, in logical pixels. */
export const PET_WINDOW_SIZE = 64;

/** The window that is currently roaming, if any. */
let petWindow: WebviewWindow | null = null;

/** Every pet window is labelled after its pet, e.g. `pet-cat`. */
export function petWindowLabel(petId: PetId): string {
  return `pet-${petId}`;
}

/**
 * Make the roaming window match the active pet.
 *
 * - `null` closes the pet window.
 * - The same pet that is already roaming is left alone.
 * - A different pet replaces the old window.
 */
export async function syncPetWindow(petId: PetId | null): Promise<void> {
  if (petId === null) {
    await closePetWindow();
    return;
  }

  const label = petWindowLabel(petId);
  if (petWindow?.label === label) {
    return;
  }

  await closePetWindow();

  // A hot reload of the notebook leaves the old native window behind, so
  // reuse it instead of failing on a duplicate label.
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    petWindow = existing;
    return;
  }

  const win = new WebviewWindow(label, {
    // Relative to the app URL, so it works in dev and in the built app.
    url: `/pet.html?id=${petId}`,
    title: `Pet ${petId}`,
    width: PET_WINDOW_SIZE,
    height: PET_WINDOW_SIZE,
    transparent: true,
    decorations: false,
    shadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focus: false,
  });

  petWindow = win;

  // Creating a window is asynchronous. Report a failure instead of leaving a
  // broken reference behind.
  await new Promise<void>((resolve, reject) => {
    win.once("tauri://created", () => resolve());
    win.once("tauri://error", (event) => {
      if (petWindow === win) petWindow = null;
      reject(new Error(`Could not create pet window: ${String(event.payload)}`));
    });
  });
}

/** Close the roaming window, if there is one. */
async function closePetWindow(): Promise<void> {
  const win = petWindow;
  petWindow = null;
  if (!win) return;

  try {
    await win.close();
  } catch (error) {
    // The window may already be gone (for example after a crash or reload).
    console.warn("Could not close the pet window:", error);
  }
}
