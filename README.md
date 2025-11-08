# Glade Runner – PyGame Skeleton

A production-grade starter harness for a top‑down exploration game called **Glade Runner**, built with PyGame.
This is designed to be expanded using iterative AI/Codex prompts.

---

## Project structure

```text
glade_runner/
│
├─ run_game.py
├─ requirements.txt
│
├─ config/
│  ├─ __init__.py
│  └─ settings.py
│
├─ game/
│  ├─ __init__.py
│  ├─ app.py
│  │
│  ├─ core/
│  │  ├─ __init__.py
│  │  ├─ scene_base.py
│  │  ├─ resource_manager.py
│  │  └─ camera.py
│  │
│  ├─ scenes/
│  │  ├─ __init__.py
│  │  ├─ main_menu.py
│  │  └─ gameplay.py
│  │
│  └─ entities/
│     ├─ __init__.py
│     └─ player.py
│
└─ assets/
   ├─ images/
   ├─ sounds/
   └─ fonts/
```

---

## Setup

1. Create and activate a virtual environment (optional but recommended):

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the game:

   ```bash
   python run_game.py
   ```

---

## What’s included

- **GameApp harness** (`game/app.py`) – main loop, scene management, FPS cap.
- **Scene system** (`game/core/scene_base.py`) – base class for menu, gameplay, etc.
- **Resource manager** (`game/core/resource_manager.py`) – cached loading for images, sounds, fonts.
- **Camera** (`game/core/camera.py`) – 2D camera that follows the player in a larger world.
- **Main menu scene** (`game/scenes/main_menu.py`) – start screen for Glade Runner.
- **Gameplay scene** (`game/scenes/gameplay.py`) – top‑down world with a movable player and HUD.
- **Player entity** (`game/entities/player.py`) – minimal character with WASD/arrow‑key movement.

All of this is deliberately clean and modular so you can grow it with focused AI/Codex prompts.

---

## Example expansion prompts (for Codex/AI)

- `game/entities/player.py`  
  > Add diagonal movement acceleration, friction, and a run key (Left Shift).

- `game/scenes/gameplay.py`  
  > Replace the placeholder world rectangle with a tile‑based map and basic collision with trees and rocks.

- `game/core/resource_manager.py`  
  > Extend this class to support loading sprite sheets and returning animation frames by name.

- `game/core/camera.py`  
  > Add smooth camera lag when following the player and a camera shake effect triggered by a function call.

- `game/app.py`  
  > Add a debug overlay toggled with F3, showing FPS, active scene name, and player coordinates.

Use these as seeds and iterate to evolve **Glade Runner** into a full exploration game.
