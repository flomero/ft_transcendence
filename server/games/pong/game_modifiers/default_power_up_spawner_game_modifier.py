import math
from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY
from ...modifiers_utils import spawn_powerup_bell


class DefaultPowerUpSpawnerGameModifier(PongModifierBase):
    name = "default_power_up_spawner_game_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_interval_center = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["spawn_interval_center"]
        self.spawn_interval_deviation = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["spawn_interval_deviation"]

        self.duration = self.spawn_interval_center

        self.pos_cdf = init_pos_cdf()

    def on_game_start(self, game: MultiplayerPong):
        self.activate(game)
        self.duration = game.rng.gauss(self.spawn_interval_center, self.spawn_interval_deviation)

    def on_deactivation(self, game: MultiplayerPong):
        """Spawns a power_up, then reactivate with a random duration"""

        try:
            random_pos = spawn_powerup_bell(
                center=(game.wall_distance, game.wall_distance),
                radius=game.wall_distance - game.wall_height,
                margin=(1.5 * game.paddle_offset, 3.0 * (game.paddle_offset + game.wall_height)),
                pos_cdf = self.pos_cdf,
                rng=game.rng,
                obstacles=game.walls[game.player_count * 2:]   # only the extra walls
            )
        except RuntimeError:
            print(f"There was an error generating the position")
            random_angle = game.rng.random() * math.pi * 2.0
            random_pos = (
                game.wall_distance * math.cos(random_angle),
                game.wall_distance * math.sin(random_angle)
            )

        print(f"Spawning a power up at:")
        print(f"  |- pos: {random_pos}\n")
        game.spawn_power_up(random_pos, game.rng)

        self.duration = game.rng.gauss(self.spawn_interval_center, self.spawn_interval_deviation)
        print(f"Next power_up spawn in {self.duration} ticks")
        self.activate(game)

def init_pos_cdf(pos_center=0.6, pos_span=0.1, steps=1000):
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