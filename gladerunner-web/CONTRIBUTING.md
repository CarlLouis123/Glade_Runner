# Contributing to GladeRunner Web

Thanks for helping shape GladeRunner Web! This project favors a modular, engine-first architecture. Please keep the following guidelines in mind when contributing:

## Coding standards

- **Prefer ECS systems** for gameplay logic. Create new components and systems before reaching for ad-hoc state.
- **Engine modules (`src/engine/`) should remain framework-agnostic** and must never import from `src/game/`.
- **Scenes own orchestration**: they compose engine subsystems, maintain scene-specific state, and coordinate transitions via the `SceneManager`.
- **No DOM manipulation inside engine code**. DOM interactions (HUD, overlays, menus) belong in `src/ui/` or scene-level code.
- **Workers exchange plain data only**. Share reusable algorithms via modules in `src/workers/` and communicate through structured messages.
- Keep files reasonably small (≈200 lines) and split functionality when implementations grow.

## Development workflow

1. Install dependencies with `npm install`.
2. Use `npm run dev` for hot-reload development.
3. Before submitting a PR, run:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
4. Ensure new code paths have appropriate Vitest coverage and include inline documentation/comments when behavior is non-obvious.

## Commit & PR etiquette

- Follow Conventional Commit inspiration where practical (e.g., `feat: add dash system`).
- Reference related issues in commit messages or PR descriptions.
- Provide screenshots or screen recordings for notable UI changes when possible.

Thanks again for contributing!
