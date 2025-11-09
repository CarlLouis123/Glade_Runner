"""Entry point for launching the Arcade version of Glade Runner."""
from __future__ import annotations

import os
import sys

from game.core.arcade_loader import ensure_real_arcade, is_stub
from game.core.headless import headless_env_requested


def _display_available() -> bool:
    if sys.platform.startswith("linux"):
        return bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))
    return True

if headless_env_requested() or not _display_available():
    real_arcade_loaded = False
else:
    real_arcade_loaded = ensure_real_arcade(force=True)

from config.settings import Settings
from game.app import run


def main() -> None:
    settings = Settings()
    run(settings)

    if not real_arcade_loaded and is_stub():  # pragma: no cover - user feedback
        print(
            "\n[Warning] Running with the bundled Arcade stub. "
            "Install the 'arcade' package to experience the full game."
        )


if __name__ == "__main__":
    main()
