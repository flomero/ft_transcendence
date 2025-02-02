import random
import math
from ..pong_modifier_base import PongModifierBase


class DefaultGoalModifier(PongModifierBase):
    name = "default_goal_modifier"

    def __init__(self):
        super().__init__()


    def on_goal(self, game, player_id):
        random_angle = random.uniform(0, 360)  # Random angle in degrees
        game.ball["x"] = 50
        game.ball["y"] = 50
        game.ball["dx"] = (math.cos(random_angle))
        game.ball["dy"] = (math.sin(random_angle))