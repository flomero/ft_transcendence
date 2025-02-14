import random
import math
from ..pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from ...game_registry import GAME_REGISTRY
from ...modifiers_utils import spawn_powerup_bell


class DefaultPowerUpSpawnerGameModifier(PongTimeLimitedModifierBase):
    name = "default_power_up_spawner_game_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_interval_center = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["spawn_interval_center"] * 30.0
        self.spawn_interval_deviation = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["spawn_interval_deviation"] * 30.0

        self.duration = random.gauss(self.spawn_interval_center, self.spawn_interval_deviation)
        print(f"Next power_up spawn in {self.duration} ticks")

        self.pos_cdf = init_pos_cdf()

    def on_game_start(self, game):
        self.activate(game)

    def on_deactivation(self, game):
        """Spawns a power_up, then reactivate with a random duration"""
        try:
            random_pos = spawn_powerup_bell(
                center=(game.wall_distance, game.wall_distance),
                radius=game.wall_distance - game.wall_height,
                margin=(1.5 * game.paddle_offset, 3.0 * (game.paddle_offset + game.wall_height)),
                pos_cdf = self.pos_cdf,
                obstacles=game.walls[game.player_count * 2:]   # only the extra walls
            )
        except RuntimeError:
            print(f"There was an error generating the position")
            random_angle = random.random() * math.pi * 2.0
            random_pos = (
                game.wall_distance * math.cos(random_angle),
                game.wall_distance * math.sin(random_angle)
            )

        game.spawn_power_up(random_pos)

        self.duration = random.gauss(self.spawn_interval_center, self.spawn_interval_deviation)
        print(f"Next power_up spawn in {self.duration} ticks")
        self.activate(game)

def init_pos_cdf(pos_center=0.6, pos_span=0.05, steps=1000):
    sample_x = [x/steps for x in range(steps)]
    pos_pdf = [
        math.exp(-((x - pos_center)**2) / (2.0 * pos_span**2))
        for x in sample_x
    ]

    total_pdf = sum(pos_pdf)
    pos_pdf = [
        p / total_pdf
        for p in pos_pdf
    ]

    pos_cdf = []
    cumulative = 0.0
    for p in pos_pdf:
        cumulative += p
        pos_cdf.append(cumulative)

    return pos_cdf