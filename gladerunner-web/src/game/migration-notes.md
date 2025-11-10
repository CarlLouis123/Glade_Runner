# Migration checklist from Python Arcade version

- [ ] Player movement and collision translated into ECS systems that sample the tilemap collision layer.
- [ ] Scene transitions mapped to `SceneManager` (`push`, `pop`, `replace`).
- [ ] Asset references moved into the sprite atlas (`src/assets/atlas.json` + future texture sheet).
- [ ] Camera follow implemented via the renderer camera helpers.
- [ ] AI routines & timers refactored into worker pool jobs or requestAnimationFrame-driven schedulers.
