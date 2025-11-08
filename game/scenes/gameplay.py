# game/scenes/gameplay.py
import random
import pygame
from game.core.scene_base import SceneBase
from game.core.camera import Camera
from game.entities.player import Player
from game.world import tiles


class GameplayScene(SceneBase):
    """
    Core top-down exploration scene for Glade Runner.
    """

    def __init__(self, app):
        super().__init__(app)

        s = app.settings
        base_world_width = s.WORLD_WIDTH
        base_world_height = s.WORLD_HEIGHT

        # Tile configuration
        self.tile_size = 40
        self.map_width = max(1, base_world_width // self.tile_size)
        self.map_height = max(1, base_world_height // self.tile_size)
        self.world_width = self.map_width * self.tile_size
        self.world_height = self.map_height * self.tile_size

        # Tilemap data
        self.tilemap = self._generate_tilemap()

        # Simple world background colour for now
        self.bg_color = (16, 60, 40)

        # Entities
        self.player = Player(self.world_width / 2, self.world_height / 2)

        # Camera following the player
        self.camera = Camera(
            world_width=self.world_width,
            world_height=self.world_height,
            screen_width=self.app.screen_rect.width,
            screen_height=self.app.screen_rect.height,
        )

        # Example: minimal HUD font
        self.hud_font = pygame.font.SysFont("consolas", 20)

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            self.app.quit()

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                # ESC: go back to main menu for now
                from game.scenes.main_menu import MainMenuScene
                self.app.change_scene(MainMenuScene(self.app))

    def update(self, dt: float) -> None:
        # Update entities
        self.player.update(dt, self.world_width, self.world_height, self.is_walkable_at)
        self.camera.update(self.player.rect)

    def draw(self, surface: pygame.Surface) -> None:
        surface.fill(self.bg_color)

        # Draw tilemap
        for y, row in enumerate(self.tilemap):
            for x, tile_id in enumerate(row):
                tile_def = tiles.get_tile_def(tile_id)
                tile_rect = pygame.Rect(
                    x * self.tile_size,
                    y * self.tile_size,
                    self.tile_size,
                    self.tile_size,
                )
                pygame.draw.rect(surface, tile_def.color, self.camera.apply(tile_rect))

        # Player
        self.player.draw(surface, self.camera)

        # HUD
        self._draw_hud(surface)

    def _generate_tilemap(self) -> list[list[int]]:
        rng = random.Random(1337)
        tilemap: list[list[int]] = []

        center_x = self.map_width // 2
        center_y = self.map_height // 2
        volcano_center = (int(self.map_width * 0.8), int(self.map_height * 0.3))

        for y in range(self.map_height):
            row: list[int] = []
            for x in range(self.map_width):
                distance_to_edge = min(
                    x,
                    y,
                    self.map_width - 1 - x,
                    self.map_height - 1 - y,
                )

                if distance_to_edge < 2:
                    tile_id = tiles.DEEP_WATER
                elif distance_to_edge < 4:
                    tile_id = tiles.SHALLOW_WATER
                elif distance_to_edge < 5:
                    tile_id = tiles.BEACH_SAND
                else:
                    noise = rng.random()
                    if noise < 0.05:
                        tile_id = tiles.FOREST
                    elif noise < 0.08:
                        tile_id = tiles.FARM_FIELD
                    else:
                        tile_id = tiles.GRASS

                    # Roads crossing the glade
                    if abs(x - center_x) <= 1 or abs(y - center_y) <= 1:
                        tile_id = tiles.ROAD

                    # Town square at the crossroads
                    if abs(x - center_x) <= 2 and abs(y - center_y) <= 2:
                        tile_id = tiles.TOWN_STONE

                    # Farm belt to the south
                    if (
                        0.55 * self.map_height < y < 0.75 * self.map_height
                        and 0.25 * self.map_width < x < 0.45 * self.map_width
                    ):
                        tile_id = tiles.FARM_FIELD

                    # Mountain range in the northwest
                    if x < int(self.map_width * 0.2) and y < int(self.map_height * 0.25):
                        tile_id = tiles.MOUNTAIN

                    # Volcano in the northeast
                    vx, vy = volcano_center
                    manhattan = abs(x - vx) + abs(y - vy)
                    if manhattan < 3:
                        tile_id = tiles.LAVA
                    elif manhattan < 5:
                        tile_id = tiles.VOLCANO_ROCK

                row.append(tile_id)

            tilemap.append(row)

        return tilemap

    def is_walkable_at(self, world_x: float, world_y: float) -> bool:
        if not (0 <= world_x < self.world_width and 0 <= world_y < self.world_height):
            return False

        tile_x = int(world_x // self.tile_size)
        tile_y = int(world_y // self.tile_size)
        tile_id = self.tilemap[tile_y][tile_x]
        return tiles.get_tile_def(tile_id).walkable

    def _draw_hud(self, surface: pygame.Surface) -> None:
        fps = int(self.app.clock.get_fps())
        text = f"FPS: {fps} | Pos: ({int(self.player.pos.x)}, {int(self.player.pos.y)})"
        hud_surf = self.hud_font.render(text, True, (240, 255, 240))
        surface.blit(hud_surf, (10, 10))
