import random
import math
from ..pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from ...game_base import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong
from ...modifiers_utils import spawn_powerup_bell


class DefaultPowerUpSpawnerGameModifier(PongTimeLimitedModifierBase):
    name = "default_power_up_spawner_game_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_interval_center = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["spawn_interval_center"] * 30.0
        self.spawn_interval_deviation = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["spawn_interval_deviation"] * 30.0

        self.duration = random.gauss(self.spawn_interval_center, self.spawn_interval_deviation)

    def on_game_start(self, game):
        self.activate(game)

    def on_deactivation(self, game):
        """Spawns a power_up, then reactivate with a random duration"""
        try:
            random_pos = spawn_powerup_bell(
                arena_radius=game.WALL_DISTANCE,
                margin=game.PADDLE_OFFSET,
                bell_center=game.WALL_DISTANCE * 2.0 / 10.0,
                obstacles=game.walls[game.player_count * 2 + 1:]   # only the extra walls
            )
            game.spawn_power_up(random_pos)
        except RuntimeError:
            random_angle = random.random() * math.pi * 2.0
            random_pos = (
                game.WALL_DISTANCE * math.cos(random_angle),
                game.WALL_DISTANCE * math.sin(random_angle)
			)

        self.duration = random.gauss(self.spawn_interval_center, self.spawn_interval_deviation)
        self.activate(game)
