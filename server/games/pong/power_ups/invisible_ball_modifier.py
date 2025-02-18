import random
import math
from games.pong.pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from games.game_registry import GAME_REGISTRY
from games.pong.multiplayer_pong import MultiplayerPong

class InvisibleBallModifier(PongTimeLimitedModifierBase):
    """Makes the ball disappear & randomly change direction."""
    name = "invisible_ball_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]
        self.speed_boost_coef = GAME_REGISTRY["pong"]["power_ups"][self.name]["speed_boost_coef"]

        self.initial_ball_speed = 0.0

    def on_activation(self, game: MultiplayerPong):
        """Makes the ball invisible and stops its movement."""
        super().on_activation(game)
        self.initial_ball_speed = game.balls[0]["speed"]
        game.balls[0]["visible"] = False
        game.balls[0]["speed"] = 0  # Stops the ball completely

    def on_deactivation(self, game: MultiplayerPong):
        """Restores the ball, increases speed by 10%, and launches it in a random direction."""
        game.balls[0]["visible"] = True
        game.balls[0]["speed"] = self.initial_ball_speed * (1.0 + self.speed_boost_coef)  # Increase speed by 10%

        # Randomly launch in a direction (improve balancing later)
        random_angle = random.uniform(0, 360)  # Random angle in degrees
        game.balls[0]["dx"] = math.cos(random_angle)
        game.balls[0]["dy"] = math.sin(random_angle)

        game.power_up_manager.deactivate_power_up(self)

    def on_goal(self, game: MultiplayerPong, player_id=-1):
        self.deactivate(game)