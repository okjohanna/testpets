# Project: Todo Pets

Build an **offline desktop to-do app** with a notebook-style task list, a coin reward system, and a virtual pet that roams the screen. Start with a working prototype, using placeholder graphics.

## Tech stack (please use exactly this)

- Tauri 2 (Rust side kept minimal; no custom Rust unless required)
- TypeScript (vanilla, no UI framework), plain HTML/CSS, Vite
- `tauri-plugin-store` for saving data as JSON in the OS app-data folder
- Fully offline: no CDNs, remote fonts, analytics, or network plugins. Set a strict CSP (`default-src 'self'`).
- Target: Windows first, but avoid Windows-only code where possible.

## Layout (see attached )

The sketch shows a desktop (black), the to-do list window (purple), and a pet (green).

- The UI concept sketch is in sketch.png (purple = to-do notebook window, green = pet, black = desktop).
- The notebook window sits in the **bottom-right corner of the desktop**, just above the taskbar, like a small widget.
- The pet is a separate small window that walks around the **whole desktop**, not just inside the notebook.

## Window 1: Notebook (main window)

- Looks like a **page torn from a notebook**: paper color, ruled lines, torn/perforated top edge.
- **Borderless** (no OS title bar). Provide a small custom drag area (e.g. the top edge) so it can still be moved.
- **Resizable and responsive**, max 420x640 px, min 320x420 px. Layout must adapt to the size.
- **Ctrl+Q quits the app** (keep it in one place so it's easy to change later).
- Option to keep the notebook **always on top** (toggle), and an option to **hide** it. Since it's borderless, add a **system tray icon** to show it again, plus Quit.
- Two pages, switched by a small button in a **bottom corner** of the notebook.

### Page 1: Tasks

- Add tasks, mark them done (crossed out), delete them, and **re-order them** (drag and drop).
- Completing a task gives the user **coins**, only once per task (un-checking and re-checking must not give coins again).
- The **coin balance is shown** on the page.

### Page 2: Pets

- Pets are shown in a **grid** on a separate notebook page.
- **Locked pets are greyed out**. Each shows its coin price. Clicking one lets the user unlock it if they have enough coins.
- From the **unlocked** pets, the user can **pick one** to be the active roaming pet. Picking another replaces it.
- Pets are **placeholder colored squares** for now. Keep the pet definitions (id, name, color, price) in one data file so sprites can be swapped in later.

## Window 2: The roaming pet

- A tiny (about 64x64) **transparent, frameless, always-on-top** window with no taskbar entry. It only covers the pet, so clicks anywhere else go to the apps below.
- **Slowly roams** the screen on its own: it picks a random target, walks there, waits a few seconds, and repeats. Stay within screen bounds.
- Can be **dragged** with the mouse (use `startDragging()`). After a drop, it pauses briefly and then resumes roaming. Detect the end of a drag by watching for the window to stop moving, not by `mouseup`.
- Spawned and closed by the notebook window when the active pet changes. Respawn the saved pet on startup.

## Data (saved locally, nothing lost on restart)

Tasks (including order and done state), coin balance, unlocked pets, the active pet, and window settings (always-on-top, size, position).

## Constraints and notes

- Tauri 2 requires explicit permissions. Create `src-tauri/capabilities/default.json` with the permissions needed, and make sure the pet window label pattern is included.
- `vite.config.ts` must list both `index.html` and `pet.html` as inputs.
- macOS needs `macOSPrivateApi` for transparent windows. Add it, but don't worry about macOS testing.
- Keep code small, readable, and commented, since a student team will extend it.

## Working method

1. First, **propose a plan and file structure** and wait for my approval.
2. Then build in small steps, in this order: (a) notebook window shell and styling, (b) tasks with persistence and coins, (c) pets page, (d) roaming pet window, (e) tray icon and always-on-top/hide.
3. Make sure the app runs with `npm run tauri dev` after each step.
