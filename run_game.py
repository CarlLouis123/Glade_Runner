"""Entry point for launching the Arcade version of Glade Runner."""
from __future__ import annotations

from config.settings import Settings
from game.app import run


def main() -> None:
    settings = Settings()
    run(settings)


if __name__ == "__main__":
    main()
