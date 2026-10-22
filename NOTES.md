# What was done

## Step 3 - Notebook shell
- Replaced the old demo panel UI with a page torn from a notebook: paper colour, blue ruled lines, a red margin line and a perforated top edge.
- The window is frameless; the torn strip and the header are drag regions so it can be moved.
- Two pages (Tasks / Pets) switched by a button in the bottom-right corner.
- On startup the notebook is parked in the bottom-right corner of the screen, just above the taskbar, and remembers position.

## Step 4 - Tasks, storage, coins, reorder
- Add, tick/untick, delete tasks. Drag and drop to reorder.
- Finishing a task pays coins once only (rewarded flag). Un-checking and re-checking never pays twice. Old finished tasks are treated as already paid.
- Coin balance shown in the header. Pure logic in game.ts with vitest coverage.
- Storage moved to pet-todo.json/app-state with safe normalisation.

## Step 5 - Pets data, unlock logic, pets page grid, pick active pet
- Pets defined in src/pets.ts as sprites or placeholder coloured squares (easy to swap for art).
- Pets grid: locked pets greyed out with price, click to unlock if affordable. Unlocked pets can be picked to be the active roaming pet; picking another replaces it.
- The pets page only saves the chosen activePetId - the notebook controller spawns and closes the pet window.

## Roaming pet window
- Separate transparent, frameless, always-on-top window, labelled pet-<id>, with no taskbar entry.
- Walks slowly to random spots inside the work area, pauses, then repeats.
- Can be dragged. The end of a drag is detected with the window's onMoved event plus a ~250 ms debounce. After a drop the pet rests about 1.5 s.
- Spawned/replaced when the active pet changes and respawned on startup.

## Quitting
- Ctrl+Q quits the whole app, including pet windows.
- Closing the notebook window also quits everything instead of leaving pet windows behind.

## Tray, hide/show, always-on-top
- A tray icon (tooltip "Testpets") with a native menu: Show / Hide, Always on top, Quit.
- Show / Hide toggles the notebook's visibility and focuses it when shown.
- Always on top is a check item. The setting is saved in the store and restored on startup (default off).
- Added `core:app:allow-default-window-icon` so the tray can use the app icon. Tray/menu/window permissions were already present in the capability file.
- Moving the notebook no longer wipes the saved always-on-top value because window settings now include it.
- STATE_VERSION bumped to 4 for the new window field. Older saves are normalised, not discarded.

## Files touched
- index.html, src/styles.css, src/types.ts, src/game.ts, src/pets.ts, src/storage.ts, src/ui.ts, src/main.ts, src/window.ts, src/petWindow.ts, src/pet.ts, src/sizes.ts, src/tray.ts, src/game.test.ts, src-tauri/capabilities/default.json.

# What was skipped and why
- `npm run tauri dev` was never run here; the human runs it and checks windows by hand.
- No unnecessary refactors.
- Everything from the planned steps is now implemented.

# Decisions made
- Torn-page look with ruled lines, margin and perforated edge. Drag by top strip/header.
- Bottom-right snap on first run using work area; otherwise restore saved position.
- rewarded flag prevents double payouts; normalise backfills for old saves.
- Reorder is quiet (no toast).
- Pets in one catalogue file with id/name/color/price. Unlock spends coins, adds to unlockedPets. Pick active only for unlocked, saves id only.
- Pet drag ending is detected from window movement, not mouseup, because the mouse can leave the window while dragging.
- The tray is built with the Tauri JS API (`Menu`, `CheckMenuItem`, `PredefinedMenuItem`, `TrayIcon`), not Rust, so all UI stays in TypeScript.

# What to test by hand
- [x] Tray icon appears with the "Testpets" tooltip; left click opens the menu
- [x] Show / Hide hides the notebook and brings it back focused
- [x] Always on top ticks/unticks and changes the window behaviour
- [x] Always-on-top setting survives a restart
- [x] Position and always-on-top both survive dragging + restart
- [x] Tray Quit closes the notebook and any pet window
- [x] Ctrl+Q and closing the notebook still quit everything
- [ ] Pet roams by itself, can be dragged, and resumes after a drop
- [ ] Pick another unlocked pet - old pet window closes and the new one appears
- [ ] Add/tick/untick/delete tasks; finish once gives +5 coins and re-ticking gives no more
- [ ] Drag to reorder tasks and restart - order persists
- [ ] Locked pets cannot be unlocked without enough coins; unlocked pets persist
- [x] npx tsc --noEmit, npx vitest run, npm run build pass
