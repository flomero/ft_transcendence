import math
import random
from ..pong_modifier_base import PongModifierBase
from ...game_registry import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong


class MultiballModifier(PongModifierBase):
    name = "multiball_modifier"

    def __init__(self, player_id):
        super().__init__()

        self.player_id = player_id

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]
        self.split_angle_to_pi = GAME_REGISTRY["pong"]["power_ups"][self.name]["split_angle_to_pi"]
        self.spawn_count_per_side = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_count_per_side"]

        self.new_balls = []

    def on_activation(self, game):
        """Splits the ball into several balls with different angles.

        The extra balls (with do_goal=False) and the original ball (with do_goal=True)
        all originate from the same position. The new directions are evenly spaced
        between -pi/split_angle_to_pi and +pi/split_angle_to_pi relative to the original ball's angle.
        One of these angles is randomly chosen to be the new direction for the original ball.
        """
        # Grab the original ball and compute its angle using atan2 for correctness.
        og_ball = game.balls[0]
        og_alpha = math.atan2(og_ball["dy"], og_ball["dx"])

        # We want to have (2 * spawn_count_per_side + 1) total balls. For example, if spawn_count_per_side=2,
        # then we want 5 balls with offsets corresponding to k in [-2,-1,0,1,2].
        n = self.spawn_count_per_side
        max_offset = math.pi / self.split_angle_to_pi

        # Compute the list of angles. Each angle is:
        #   new_angle = og_alpha + (k/n) * max_offset, with k from -n to n (inclusive).
        angles = [og_alpha + (k / n) * max_offset for k in range(-n, n + 1)]

        # Randomly choose one of the computed angles for the original ball.
        chosen_index = random.randint(0, len(angles) - 1)
        chosen_angle = angles.pop(chosen_index)
        og_ball["dx"] = math.cos(chosen_angle)
        og_ball["dy"] = math.sin(chosen_angle)
        # The original ball should still be able to score, so we leave its do_goal flag untouched.

        # Create extra balls for each of the other angles.
        self.new_balls = [
            {
                "x": og_ball["x"],
                "y": og_ball["y"],
                "dx": math.cos(angle),
                "dy": math.sin(angle),
                "speed": 1.2 * og_ball["speed"],
                "size": 0.8 * og_ball["size"],
                "visible": True,
                "do_collision": True,
                "do_goal": False  # Extra balls cannot score.
            }
            for angle in angles
        ]
        game.balls += self.new_balls

    def on_deactivation(self, game: MultiplayerPong):
        """Removes the spawned extra balls."""
        super().on_deactivation(game)
        for ball in self.new_balls:
            if ball in game.balls:
                game.balls.remove(ball)
        game.power_up_manager.deactivate_power_up(self)

