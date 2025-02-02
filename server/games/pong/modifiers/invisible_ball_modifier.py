import random
from .pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from games.game_base import GAME_REGISTRY
from games.pong.multiplayer_pong import MultiplayerPong

class InvisibleBallModifier(PongTimeLimitedModifierBase):
    """Makes the ball disappear & randomly change direction."""

    name = "invisible_ball_modifier"

    def __init__(self):
        super().__init__()

        self.duration = GAME_REGISTRY["pong"]["modifiers"][InvisibleBallModifier.name]["duration"]
        self.initial_ball_speed = 0

    def on_activation(self, game: MultiplayerPong):
        """Makes the ball invisible and stops its movement."""
        super().on_activation()
        self.initial_ball_speed = game.ball["speed"]
        game.ball["visible"] = False
        game.ball["speed"] = 0  # Stops the ball completely

    def on_deactivation(self, game: MultiplayerPong):
        """Restores the ball, increases speed by 10%, and launches it in a random direction."""
        game.ball["visible"] = True
        game.ball["speed"] = self.initial_ball_speed * 1.1  # Increase speed by 10%

        # Randomly launch in a direction (improve balancing later)
        random_angle = random.uniform(0, 360)  # Random angle in degrees
        game.ball["direction"] = (random_angle)