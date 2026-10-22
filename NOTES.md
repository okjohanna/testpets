# What was done

## Step 3 - Notebook shell
- Replaced the old demo panel UI with a page torn from a notebook: paper colour, blue ruled lines, a red margin line and a perforated top edge.
- The window is frameless; the torn strip and the header are drag regions so it can be moved.
- Two pages (Tasks / Pets) switched by a button in the bottom-right corner.
- On startup the notebook is parked in the bottom-right corner of the screen, just above the taskbar, and remembers size and position.

## Step 4 - Tasks, storage, coins, reorder
- Add, tick/untick, delete tasks. Drag and drop to reorder.
- Finishing a task pays coins once only (rewarded flag). Un-checking and re-checking never pays twice. Old finished tasks are treated as already paid.
- Coin balance shown in the header. Pure logic in game.ts with vitest coverage (13 tests pass).
- Storage moved to pet-todo.json/app-state with safe normalisation.

## Step 5 - Pets data, unlock logic, pets page grid, pick active pet
- Pets defined in src/pets.ts as placeholder coloured squares (easy to swap for sprites).
- Pets grid: locked pets greyed out with price, click to unlock if affordable. Unlocked pets can be picked to be the active roaming pet; picking another replaces it.
- Pets page only saves the chosen activePetId - no pet window spawned.

## Files touched
- index.html, src/styles.css, src/types.ts, src/game.ts, src/pets.ts, src/storage.ts, src/ui.ts, src/main.ts, src/window.ts (new), src/game.test.ts (new).

# What was skipped and why
- Pet window, tray, always-on-top, hide/show, Ctrl+Q - left for later as instructed.
- Spawning the roaming pet window - only save active pet id.
- Rust/permissions changes - not needed.
- npm run tauri dev - forbidden.
- Unnecessary refactors.

# Decisions made
- Torn-page look with ruled lines, margin and perforated edge. Drag by top strip/header.
- Bottom-right snap on first run using work area; otherwise restore saved position/size.
- rewarded flag prevents double payouts; normalise backfills for old saves.
- Reorder is quiet (no toast). 
- Pets in one catalogue file with id/name/color/price. Unlock spends coins, adds to unlockedPets. Pick active only for unlocked, saves id only.

# What to test by hand in the morning
- [ ] Notebook appears bottom-right above taskbar, torn paper look
- [ ] Drag by strip/header, restart - returns to same place/size
- [ ] Add/tick/untick/delete tasks
- [ ] Finish a task once - coins +5; untick and retick - no extra coins
- [ ] Drag to reorder - persists
- [ ] Switch between Tasks and Pets pages
- [ ] Locked pets greyed out with price; can't unlock if low coins; can unlock if enough
- [ ] Pick unlocked pet as active; pick another to replace
- [ ] Restart - tasks/order/coins/unlocked/active pet persist
- [ ] npx vitest run and npm run build pass
