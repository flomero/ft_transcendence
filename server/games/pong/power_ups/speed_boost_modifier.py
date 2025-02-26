from ..pong_modifier_base import PongModifierBase
from games.game_registry import GAME_REGISTRY
from games.pong.multiplayer_pong import MultiplayerPong

class SpeedBoostModifier(PongModifierBase):
    """Increases ball speed every updates for a duration."""
    name = "speed_boost_modifier"

    def __init__(self, player_id):
        super().__init__()

        self.player_id = player_id

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]
        self.ramp_up_strength = GAME_REGISTRY["pong"]["power_ups"][self.name]["ramp_up_strength"]
        self.ramp_up_frequency = GAME_REGISTRY["pong"]["power_ups"][self.name]["ramp_up_frequency"]

    def on_update(self, game: MultiplayerPong):
        """Ramps us the speed"""
        super().on_update(game)
        if (self.ticks % self.ramp_up_frequency) == 0:
            game.balls[0]["speed"] *= (1 + self.ramp_up_strength)

    def on_deactivation(self, game: MultiplayerPong):
        super().on_deactivation(game)
        game.power_up_manager.deactivate_power_up(self)

    def on_goal(self, game, player_id=-1):
        """On goal, deactivates itself"""
        self.deactivate(game)

