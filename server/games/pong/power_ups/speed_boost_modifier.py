from games.pong.pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from games.game_registry import GAME_REGISTRY
from games.pong.multiplayer_pong import MultiplayerPong

class SpeedBoostModifier(PongTimeLimitedModifierBase):
    """Increases ball speed every updates for a duration."""
    name = "speed_boost_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]
        self.ramp_up_strength = GAME_REGISTRY["pong"]["power_ups"][self.name]["ramp_up_strength"]
        self.ramp_up_frequency = GAME_REGISTRY["pong"]["power_ups"][self.name]["ramp_up_frequency"]

    def on_update(self, game: MultiplayerPong):
        """Ramps us the speed"""
        super().on_update(game)
        if (self.ticks % self.ramp_up_frequency) == 0:
            print(f"  |- {game.balls[0]['speed']}  -->  ")
            game.balls[0]["speed"] *= (1 + self.ramp_up_strength)

    def on_deactivation(self, game: MultiplayerPong):
        super().on_deactivation(game)
        if self in game.power_up_manager.active_power_ups:
            game.power_up_manager.active_power_ups.remove(self)

    def on_goal(self, game, player_id=-1):
        """On goal, deactivates itself"""
        self.deactivate(game)

