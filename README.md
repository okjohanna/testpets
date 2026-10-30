# 🐾 Pet Todo

An **offline desktop to-do app**.
Finish tasks to earn coins, unlock pets, and let the active pet roam your
desktop while you work.

Built with **Tauri 2** (Rust kept minimal), **TypeScript** (vanilla, no UI
framework), **Vite** and plain HTML/CSS.

---

## Running it

```bash
npm install          # install the frontend packages
npm run tauri:dev    # start the app with hot reload
```

Other useful commands:

| Command | What it does |
| --- | --- |
| `npm run tauri:dev` | Run the app in development mode |
| `npm run tauri:build` | Build a release installer (.msi + .exe) |
| `npm run tauri:add <plugin>` | Add a Tauri plugin, e.g. `npm run tauri:add store` |
| `npm run build` | Type-check and build just the frontend |
| `npx vitest run` | Run the unit tests for the game rules |
| `npm run tauri info` | Check that your toolchain is set up correctly |

> **Note:** `npm tauri ...` does **not** work on npm 7+. You always need the
> `run` part: `npm run tauri dev`.

The app works fully offline: no CDNs, remote fonts, analytics or updater.

---

## How it works

### Tasks
- Add a task, tick it off, untick it, delete it, or drag it to reorder.
- Finishing a task pays **5 coins, once per task**. Unticking and reticking
  never pays twice, and coins are never taken back.
- Long task text wraps so the whole task stays visible.

### Pets
- The Pets page shows a grid of pets. Locked pets are greyed out and show their
  price (10 to 100 coins).
- Click a locked pet to unlock it if you have enough coins.
- Unlocking does not make a pet active. Pick one of your unlocked pets to make
  it the active roaming pet; picking another replaces it.
- The active pet is a small transparent window that roams the desktop, can be
  dragged, and pauses after you drop it.

### Notebook window
- The window is borderless and transparent, with paper, ruled lines, a red
  margin line and a torn top edge.
- Drag it by the top strip or the header.
- It starts in the bottom-right corner, just above the taskbar, and remembers
  its position.
- Fixed size, not resizable.

### Tray and shortcuts
- The tray icon (tooltip "Testpets") has **Show / Hide**, **Always on top**
  and **Quit**.
- **Always on top** is saved and restored on startup. It is off by default.
- **Ctrl+Q** quits the whole app, including pet windows.
- Closing the notebook window also quits everything.

---

## Project structure

```
src/
  main.ts       Controller. Owns the state, handles UI events, saves.
  game.ts       ALL rules. Pure functions, no DOM, no Tauri. Unit tested.
  game.test.ts  Vitest tests for game.ts.
  pets.ts       Pet catalogue (id, name, colour, sprite, price).
  types.ts      Shapes of everything stored. Bump STATE_VERSION if changed.
  storage.ts    Load/save via the store plugin (Tauri boundary for data).
  window.ts     Notebook placement and position saving.
  ui.ts         All DOM rendering and event wiring.
  petWindow.ts  Creates/replaces/closes the roaming pet window.
  pet.ts        Entry point of the roaming pet window (pet.html).
  tray.ts       System tray icon and its native menu.
  sizes.ts      Window sizes shared by CSS and code.
  styles.css    Styling.
```

### The rules that keep this codebase tidy

1. **`game.ts` is pure.** Every function takes an `AppState` and returns a new
   one. It never reads the DOM and never calls Tauri, so the rules can be unit
   tested without booting the app.
2. **`ui.ts` never changes state.** It renders state and reports what the
   player did; `main.ts` decides what that means.
3. **Tauri is kept at the edges.** Only the window, storage, pet-window and
   tray modules talk to Tauri.

---

## Data

Everything is saved with `tauri-plugin-store` in the OS app-data folder:

```
%APPDATA%\com.johanna.testpets\pet-todo.json
```

Saved: tasks (order, done, rewarded), coins, unlocked pets, active pet, and
window settings (position and always-on-top; not size). Loading tolerates old
or broken saves through `normalizeState`. Delete the file to reset the app.

---

## Art direction

The target look is **retro futuristic pixel art**. Current visuals are
placeholders (CSS shapes, coloured squares, one dog sprite).

Rules:
- Assets live in `src/assets/` and are imported from code so Vite bundles them.
- Pet sprites are one PNG per pet, named after the pet id (`cat.png`).
- Show pixel art with integer scaling and `image-rendering: pixelated`.
- Keep the notebook look in as few CSS variables and files as possible.

---

## Ideas for contributions

- **More sprites.** Replace the remaining colour squares in `src/pets.ts` with
  PNGs in `src/assets/pets/`.
- **Pet animation.** Add simple walk/idle frames to the roaming pet window.
- **More pets and prices.** Extend `src/pets.ts` and the `PetId` type.
- **Task difficulty.** Give harder tasks a bigger coin reward.
- **Better save migration.** Add explicit migrations instead of normalising
  everything at once.

---

## Notes on the toolchain

This project needs Node.js `^20.19` or `>=22.12` (Vite 8), Rust 1.85+ (the
Rust 2024 edition), the Microsoft C++ Build Tools, and the WebView2 runtime.
Run `npm run tauri info` to check everything is in place.

`macOSPrivateApi` is enabled for transparent windows, but macOS is not tested.
Windows is the primary target.
