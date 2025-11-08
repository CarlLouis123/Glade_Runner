# run_game.py
from config.settings import Settings
from game.app import GameApp


def main() -> None:
    settings = Settings()
    app = GameApp(settings)
    app.run()


if __name__ == "__main__":
    main()
