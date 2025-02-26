import random
from ..pong_modifier_base import PongModifierBase
from ...game_registry import GAME_REGISTRY


class ExtraWallsMovementGameModifier(PongModifierBase):
    name = "extra_walls_movement_game_modifier"

    def __init__(self):
        super().__init__()

        self.amplitude = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["amplitude"]
        self.speed = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["speed"]
        self.steps = 0

    def on_update(self, game):
        for i, pos in enumerate(self.positions):
            game.walls[self.first_wall + i]["x"] += pos["direction"] * self.speed * game.walls[self.first_wall + i]["nx"]
            game.walls[self.first_wall + i]["y"] += pos["direction"] * self.speed * game.walls[self.first_wall + i]["ny"]

            pos["steps"] += pos["direction"]
            if abs(pos["steps"]) >= self.amplitude:
                pos["steps"] = pos["direction"] * self.amplitude
                pos["direction"] *= -1.0

    def on_game_start(self, game):
        self.first_wall = game.player_count * 2
        self.extra_walls = game.walls[self.first_wall:-1]
        self.positions = [
            {
                "initial": {
                    "x": wall["x"],
                    "y": wall["y"],
                },
                "direction": 1.0,
                "steps": 0
            }
            for wall in self.extra_walls
        ]

        for i, pos in enumerate(self.positions):
            rnd_step = game.rng.randint(-self.amplitude + 1, self.amplitude - 1)
            rnd_direction = 1.0 if game.rng.random() < 0.5 else -1.0

            pos["direction"] = rnd_direction
            pos["steps"] = rnd_step

            game.walls[self.first_wall + i]["x"] += pos["steps"] * self.speed * game.walls[self.first_wall + i]["nx"]
            game.walls[self.first_wall + i]["y"] += pos["steps"] * self.speed * game.walls[self.first_wall + i]["ny"]


