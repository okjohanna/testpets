/**
 * Window sizes, in logical pixels.
 *
 * This is the single place where window geometry is written down for the
 * frontend. The notebook's size is also configured in `tauri.conf.json`
 * (Rust creates that window); everything else - including the roaming pet
 * window, which TypeScript creates - reads the values from here.
 *
 * Both dimensions are applied as CSS variables on `:root` by `applySizes()`,
 * so the stylesheet never hard-codes a size either.
 */

/** The notebook window: 365 x 520, fixed and not resizable. */
export const NOTEBOOK_SIZE = { width: 365, height: 520 };

/** The roaming pet window: a small square. */
export const PET_WINDOW_SIZE = { width: 64, height: 64 };

/**
 * Publish the sizes to CSS as `--notebook-width`, `--notebook-height` and
 * `--pet-size`. Called once at startup, from both entry points.
 */
export function applySizes(): void {
  const root = document.documentElement.style;
  root.setProperty("--notebook-width", `${NOTEBOOK_SIZE.width}px`);
  root.setProperty("--notebook-height", `${NOTEBOOK_SIZE.height}px`);
  root.setProperty("--pet-size", `${PET_WINDOW_SIZE.width}px`);
}
