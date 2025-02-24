from ...modifier_base import ModifierBase
from ...game_registry import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong


class DefaultWallBounceSpeedboostGameModifier(ModifierBase):
    name = "default_wall_bounce_speedboost_game_modifier"

    def __init__(self):
        super().__init__()

        self.ramp_up_strength = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["ramp_up_strength"]

    def on_wall_bounce(self, game: MultiplayerPong, player_id=-1):
        """On wall bounce, ramp up the speed of the ball"""
        game.balls[0]["speed"] *= (1 + self.ramp_up_strength)