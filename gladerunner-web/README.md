# GladeRunner Web

GladeRunner Web is a browser-based reimagining of the GladeRunner project built with Vite, TypeScript, and a modular engine-first architecture. The project renders to an HTML canvas, organizes game logic with a lightweight ECS, and offloads heavy tasks (such as pathfinding) to background workers.

## Quick start

```bash
npm install
npm run dev
```

Additional scripts:

- `npm run build` – generate a production build in `dist/`
- `npm run preview` – preview the production build
- `npm run test` – execute the Vitest test suite
- `npm run typecheck` – run the TypeScript compiler in `--noEmit` mode
- `npm run lint` – lint the codebase with ESLint
- `npm run format` – format sources with Prettier

## Project layout

```
public/
src/
  engine/      # Rendering, ECS, resources, input, workers, math/time, save helpers
  game/        # Scenes, gameplay configuration, telemetry helpers, migration notes
  ui/          # Global styles and UI primitives
  workers/     # Background workers and pure pathfinding logic
  assets/      # Placeholder atlas metadata and texture references (no binaries committed)
tests/         # Vitest unit tests for math, pathfinding, tilemaps
```

Key entry points:

- `src/main.ts` – boots the engine, registers global error handlers, and loads the initial scene
- `src/engine/app.ts` – orchestrates the render loop, scene manager, HUD updates, and canvas resize handling
- `src/game/scenes/` – scene implementations (`MainMenu`, `Gameplay`) that coordinate engine subsystems

## Module boundaries

- Engine modules (`src/engine/`) expose reusable systems and **must not import from `src/game/`**
- Game scenes orchestrate ECS entities, renderer, and worker pool usage without embedding engine code
- Workers exchange data via structured messages only; shared logic lives in pure helper modules under `src/workers/`
- UI concerns live under `src/ui/` and interact with the DOM outside of core engine code

## Acceptance checklist

- `npm run dev` opens a playable canvas scene; press Enter to leave the menu and control the player with WASD/arrow keys
- Camera smoothly follows the player and HUD shows scene/debug information
- Press `F3` to toggle the debug grid overlay
- Background worker returns pathfinding results that drive the NPC
- `npm run build`, `npm run lint`, `npm run test`, and `npm run typecheck` complete without errors
