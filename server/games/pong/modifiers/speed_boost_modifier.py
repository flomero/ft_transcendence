
from .pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from games.game_base import GAME_REGISTRY
from games.pong.multiplayer_pong import MultiplayerPong

class SpeedBoostModifier(PongTimeLimitedModifierBase):
    """Increases ball speed every updates for a duration."""

    name = "speed_boost_modifier"

    def __init__(self):
        super().__init__()

        self.duration = GAME_REGISTRY["pong"]["modifiers"][SpeedBoostModifier.name]["duration"]
        self.ramp_up_strength = GAME_REGISTRY["pong"]["modifiers"][SpeedBoostModifier.name]["ramp_up_strength"]
        self.initial_ball_speed = 0

    def on_activation(self, game: MultiplayerPong, player_id=-1):
        """Starts ramping up speed for the duration"""
        super().on_activation()
        self.initial_ball_speed = game.ball["speed"]

    def on_update(self, game: MultiplayerPong):
        """Ramps us the speed"""
        super().on_update()
        game.ball["speed"] *= (1 + self.ramp_up_strength)

    def on_deactivation(self, game: MultiplayerPong):
        game.ball["speed"] = self.initial_ball_speed

