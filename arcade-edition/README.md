# Glade Runner (Arcade Edition)

> **Legacy notice:** This directory contains the original Python/Arcade build that shipped before the web rewrite. The modern browser implementation now lives at the repository root.

Glade Runner is a top-down exploration prototype now powered by the [Arcade](https://api.arcade.academy/en/latest/) framework.  The project demonstrates a clean view-based structure with hardware accelerated sprite rendering, a scrolling camera, and a procedurally themed overworld ready for expansion.

---

## Project structure

```text
Glade_Runner/
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
└─ tests/
   ├─ __init__.py
   ├─ test_imports.py
   ├─ test_instantiation.py
   └─ test_invariants.py
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

3. Launch the game (opens an Arcade window):

   ```bash
   python run_game.py
   ```

4. Run the automated test suite:

   ```bash
   pytest
   ```

---

## Key features

- **Arcade window & view system** – `game/app.py` boots an `arcade.Window` and navigates between views.
- **Scene hierarchy** – `game/core/scene_base.py` defines the shared base for menu and gameplay views.
- **Sprite-based world** – `game/scenes/gameplay.py` builds sprite lists for terrain, walls, and the player.
- **Camera tracking** – `game/core/camera.py` wraps `arcade.Camera2D` to follow the player around the world.
- **Procedural overworld** – `game/world/map.py` generates themed regions (forest, farm, town, mountains, etc.).
- **Test coverage** – `tests/` verifies imports, scene instantiation, and critical configuration invariants.

Use the foundation to grow Glade Runner into a richer exploration experience—add quests, encounters, or entirely new biomes as you iterate.
