import math
from ...time_limited_modifier_base import TimeLimitedModifierBase
from ...game_registry import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong


class CarouselDebuffModifier(TimeLimitedModifierBase):
    name = "carousel_debuff_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]

        self.steps_per_degree = GAME_REGISTRY["pong"]["power_ups"][self.name]["steps_per_degree"]   # total steps = 360 * steps_per_degree
        self.ticks_per_steps = GAME_REGISTRY["pong"]["power_ups"][self.name]["ticks_per_steps"]     # duration = total_steps * ticks_per_step

        self.total_steps = 360 * self.steps_per_degree
        self.duration = self.total_steps * self.ticks_per_steps

        self.total_angle = 0.0
        self.step_angle_rad = math.radians(1 / self.steps_per_degree)

    def on_update(self, game: MultiplayerPong):
        super().on_update(game)

        if (self.ticks % self.ticks_per_steps) == 0:
            self.total_angle += self.step_angle_rad

            game.rotate_paddles(self.total_angle)
            game.rotate_walls(self.total_angle)

    def on_deactivation(self, game: MultiplayerPong):
        super().on_deactivation(game)

        game.rotate_paddles()
        game.rotate_walls()

        game.power_up_manager.deactivate_power_up(self)

