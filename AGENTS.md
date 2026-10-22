# Project: Todo Pets

An **offline desktop to-do app**: a notebook-style task list, a coin reward system, and a virtual pet that roams the screen. A student team will extend it, so keep code small, readable and commented.

Current progress and test checklists live in NOTES.md, not here. This file only holds rules that stay true.

## Tech stack (use exactly this)

- Tauri 2 (Rust kept minimal, no custom Rust unless required)
- TypeScript (vanilla, no UI framework), plain HTML/CSS, Vite
- `tauri-plugin-store` for JSON persistence in the OS app-data folder
- Vitest for unit tests of the pure logic
- Target Windows first, but avoid Windows-only code where possible

## Offline rule

No CDNs, remote fonts or scripts, analytics, updater, or network plugins. Keep the CSP strict (`default-src 'self'`). Fonts and images are bundled from `src/assets/`.

## Environment and workflow

- The shell is **Windows PowerShell**: no `&&`, no heredocs. Run **one command per call**. Create files with the write tool.
- Verify every change with: `npx tsc --noEmit`, `npx vitest run`, `npm run build`. Run `cargo check --manifest-path src-tauri/Cargo.toml` if Rust or Cargo.toml changed.
- Do **not** run `npm run tauri dev` (it never exits). The human runs it and checks windows by hand.
- Do **not** run `npm install` or add dependencies without asking. The network is unreliable.
- Never modify `AGENTS.md`, `opencode.json` or `sketch.png`.
- Never change `productName`, `identifier`, the package name or the main window title. The team renames them manually.
- Work in small steps, stop after each step for testing, and commit with short conventional messages (`feat(tasks): ...`).
- Explore with read/glob/grep tools, not shell commands.

## Code structure

```
src/main.ts       Controller: owns the state, handles UI events, saves
src/game.ts       ALL rules. Pure functions, no DOM, no Tauri. Unit tested.
src/game.test.ts  Vitest tests for game.ts
src/pets.ts       Pet catalogue (id, name, color, price) in one data file
src/types.ts      Shapes of everything stored. Bump STATE_VERSION if changed.
src/storage.ts    Load/save via the store plugin (Tauri boundary for data)
src/window.ts     Notebook window placement and position saving
src/ui.ts         All DOM rendering and event wiring
src/pet.ts        Entry point of the roaming pet window (pet.html)
src/styles.css    Styling
```

Rules: `game.ts` stays pure. `ui.ts` never changes state; it reports what the player did and `main.ts` decides. New rules get a Vitest test.

## Layout

The UI sketch is `sketch.png` (purple = to-do notebook window, green = pet, black = desktop). The notebook sits in the **bottom-right corner** of the screen, just above the taskbar, like a small widget. The pet is a separate small window that roams the **whole desktop**.

## Window 1: Notebook (main window)

- Looks like a **page torn from a notebook**: paper colour, ruled lines, red margin line, torn top edge.
- **Borderless and transparent** (`decorations: false`, `transparent: true`, `shadow: false`). The top strip and header carry `data-tauri-drag-region` so it can be moved. Never put buttons inside a drag region.
- **Fixed size 460x520, not resizable.** (`resizable: false` also stops double-click-to-maximize, which Tauri cannot otherwise disable.)
- `dragDropEnabled: false` on this window is required, otherwise HTML5 drag-and-drop reordering of tasks fails on Windows. Do not remove it.
- **Ctrl+Q quits the whole app**, including pet windows. Keep the shortcut in one place.
- **Always-on-top toggle** (saved, default off) and **hide**. Because it is borderless, a **tray icon** with Show/Hide, Always on top and Quit is required.
- Two pages (Tasks / Pets), switched by a small button in the bottom-right corner.

### Page 1: Tasks

- Add, tick off (crossed out), delete and **drag to reorder** tasks.
- The checkbox sits left of the red margin line. Long task text wraps onto several lines so it is fully visible.
- Finishing a task pays **5 coins, once per task**. The `rewarded` flag stays on the task, so un-checking and re-checking never pays again. Coins are never taken back.
- The coin balance is shown in the header.

### Page 2: Pets

- A **grid** of pets. **Locked pets are greyed out** and show their price (10 to 100 coins). Clicking a locked pet unlocks it if the player has enough coins.
- Unlocking does **not** make the pet active. From the unlocked pets the player **picks one** as the active roaming pet; picking another replaces it.
- The pets page only saves `activePetId`. The notebook controller spawns and closes the pet window.

## Window 2: Roaming pet

- About 64x64, **transparent, frameless, always on top, no taskbar entry**, label `pet-<id>`. It only covers the pet, so clicks elsewhere reach the apps below. Do not use `setIgnoreCursorEvents`.
- **Roams slowly**: random target inside the monitor work area, walk there, wait a few seconds, repeat.
- **Draggable** with `startDragging()`. Detect the end of the drag with the window's `onMoved` event and a ~250 ms debounce, not `mouseup`. After a drop, pause about 1.5 s, then resume roaming.
- Spawned and replaced when the active pet changes, and respawned on startup.

## Data (nothing is lost on restart)

Saved in the store plugin: tasks (order, done, rewarded), coins, unlocked pets, active pet, and window settings (**position** and always-on-top; not size). Loading must tolerate old or broken saves (`normalizeState`).

## Tauri notes

- Tauri 2 needs explicit permissions in `src-tauri/capabilities/default.json`. The `windows` list must include `main` and `pet-*`. Say which permissions you add and why.
- `vite.config.ts` must list both `index.html` and `pet.html` as inputs.
- `macOSPrivateApi` is enabled for transparent windows (macOS is not tested).

## Art direction

The final aesthetic will be **retro futuristic pixel art**. Current visuals are placeholders (CSS shapes, coloured squares). Rules for art:
- Assets live in `src/assets/` and are imported from code so Vite bundles them.
- Pet sprites are one PNG per pet, named after the pet id (`cat.png`).
- Show pixel art with integer scaling and `image-rendering: pixelated`.
- Keep the notebook's look in as few CSS variables and files as possible so art can be swapped in without touching logic.