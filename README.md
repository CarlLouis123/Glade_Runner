# Glade Runner: Threefold Awakening

Glade Runner has been rebuilt around **three.js** to deliver an explorable 3D glade filled with bioluminescent landmarks, towering evergreens, and a responsive chase camera. The focus is on relaxing exploration—discover new regions, follow the lantern ring, and let the living heart of the glade react to your presence.

## Key features

- Fully real-time lighting and fog driven by three.js
- Smooth third-person controls with keyboard movement and mouse/keyboard turning
- Dynamic HUD that highlights your heading, pace, and exploration progress
- Procedural terrain colouring and ambient effects to encourage freeform wandering

## Controls

- **WASD** – move
- **Shift** – sprint
- **Hold left mouse button** or **Q/E** or **←/→** – turn the Seeker

## Getting started (PowerShell)

Run these commands directly in PowerShell from the project root—no virtual environment is needed:

```powershell
# install dependencies
npm install

# start the development server (opens http://localhost:5173 by default)
npm run dev
```

Additional scripts:

- `npm run build` – build the production bundle into `dist/`
- `npm run preview` – preview the production build locally
- `npm run lint` – lint the source with ESLint
- `npm run typecheck` – run the TypeScript compiler in `--noEmit` mode

## Project layout

```
src/
  game/        # Three.js game loop, world generation, player, HUD binding
  ui/          # Global styles for the HUD and canvas shell
index.html     # Canvas + HUD mount points
vite.config.ts # Vite configuration
```

## Development notes

- The world uses a simple analytic height function (`World.sampleHeight`), making biome tweaks straightforward.
- `InputController` exposes both keyboard and mouse-derived yaw, so alternative camera rigs are easy to experiment with.
- Adjust the chase camera offset inside `World.syncCamera` to change the exploration feel.
- All assets are generated in code; no external textures or audio files are required.
