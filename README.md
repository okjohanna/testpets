# 🐾 Pet Todo

A todo list where your virtual pets depend on you actually finishing things.
Complete a task, and your pet gains XP and levels up. Ignore your tasks for
too long and your pet gets hungry and unhappy.

Built with **Tauri v2** (Rust backend) + **Vite** + **TypeScript** (no
frontend framework).

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
| `npm run tauri info` | Check that your toolchain is set up correctly |

> **Note:** `npm tauri ...` does **not** work on npm 7+. You always need the
> `run` part: `npm run tauri dev`.

---

## How to play

- **Add a task** with a difficulty (easy / normal / hard).
- **Tick it off** to earn XP for your active pet and some coins.
- **Feed** your pet (5 coins) to fill its hunger meter.
- **Pet** your pet for free happiness.
- **Play** with your pet (8 coins) for a big happiness boost.
- Pets slowly get hungry and unhappy while you are away, based on how long
  you have been gone. Energy recovers over time.

---

## Project structure

```
src/
  main.ts      Controller. Owns the current state, turns UI events into
               game actions, saves the result.
  types.ts     The shapes of everything we store (Pet, Todo, GameState).
  game.ts      ALL the game rules. Pure functions - no DOM, no Tauri.
  pets.ts      The catalogue of pet species.
  storage.ts   Saving and loading. The only file that talks to Tauri.
  ui.ts        Everything that touches the DOM. Renders state, wires events.
  styles.css   All the styling.

src-tauri/
  src/lib.rs   Rust side. Contains the `pet_says` command.
```

### The three rules that keep this codebase tidy

1. **`game.ts` is pure.** Every function takes a `GameState` and returns a new
   one. It never reads the DOM and never calls Tauri. That means the rules can
   be unit tested without booting the app, and the UI can never accidentally
   corrupt the game state.
2. **`storage.ts` is the only Tauri boundary.** If you need a new piece of
   persisted data, add it here - not scattered through the UI.
3. **`ui.ts` never changes the game state.** It renders it and reports what
   the player did; `main.ts` decides what that means.

---

## How the stats work

Pets decay based on **wall-clock time**, not on a timer running in the app.
Each pet stores the timestamp of its last update (`lastTick`), and when the
app starts we work out how much time passed and apply the difference. This
means closing the app for three hours has the same effect as leaving it open
for three hours.

| Stat | Changes | Rate |
| --- | --- | --- |
| Hunger | Decreases over time | -1 per 30 min (varies by species) |
| Happiness | Decreases over time | -1 per 45 min (varies by species) |
| Energy | Recovers over time | +1 per 20 min |

XP needed for the next level is `50 × current level`, so level 2 needs 100 XP,
level 3 needs 150 XP, and so on.

---

## Ideas for contributions

Good first tasks, roughly in order of difficulty:

### 🟢 Easy

- **Real sprite art.** Replace the emoji in `src/pets.ts` with actual images.
  Put the files in `src/assets/pets/` and import them - `vite/client` types
  are already set up so `import catSprite from "./assets/pets/cat.png"` works.
- **More pet lines.** The phrases in `src-tauri/src/lib.rs` (`PET_LINES`) are
  a fixed list. Add your own, or make the pet respond differently depending
  on its mood.
- **Rename the app.** `productName` in `src-tauri/tauri.conf.json` and the
  `<title>` in `index.html`.

### 🟡 Medium

- **Adopt a second pet.** Add an "Adopt" button that lets the player pick a
  species and name. You will need to add to `game.ts` and `ui.ts`.
- **A mood system.** Give each pet a mood based on its stats (happy, hungry,
  sleepy, bored) and show it as an emoji or a phrase.
- **Pet shop.** Let players spend coins on a new pet.

### 🔴 Harder

- **Shop items.** Food, toys, and accessories that you can buy and use.
- **Pet death / neglect.** What happens if a pet stays at zero happiness?
- **Unit tests for `game.ts`.** Because the rules are pure functions, you can
  test them with a plain test runner and no browser. This is the best way to
  learn how to test frontend logic.

---

## Notes on the toolchain

This project needs Node.js `^20.19` or `>=22.12` (Vite 8), Rust 1.85+ (the
Rust 2024 edition), the Microsoft C++ Build Tools, and the WebView2 runtime.
Run `npm run tauri info` to check everything is in place.

Game data is saved by the `tauri-plugin-store` plugin to:

```
%APPDATA%\com.johanna.testpets\pet-todo.json
```

Delete that file to reset the game.
