import time
import math

from games.game_base import GameBase
from games.pong.pong_physics_engine import PongPhysicsEngine
from games.pong.modifiers.pong_modifier_base import PongModifierBase


class MultiplayerPong(GameBase):
    """Multiplayer pong"""

    name = "multiplayer_pong"

    WALL_HEIGHT = 2
    WALL_DISTANCE = 50 # + WALL_HEIGHT / 2.0  # Distance from the center to walls
    PADDLE_OFFSET = 2 + WALL_HEIGHT / 2.0   # Gap between paddle and wall
    PADDLE_WIDTH = 20    # Paddle width
    PADDLE_HEIGHT = 1  # Paddle height

    def __init__(self, player_count=2, modifiers=None):
        super().__init__(modifiers)

        self.last_player_hit = None
        self.player_count = player_count
        self.ball = {
                "x": 50,
                "y": 50,
                "dx": 2,
                "dy": 1,
                "speed": 2,
                "size": 0.75,
            }
        tmp = math.sqrt(self.ball["dx"]**2 + self.ball["dy"]**2)
        self.ball["dx"] /= tmp
        self.ball["dy"] /= tmp

        print(f"ball: {self.ball}")

        wall_wdith = 2.0 * math.sin(math.pi / (2.0 * self.player_count)) * (MultiplayerPong.WALL_DISTANCE * (1 + 1 / (player_count + 0.5)))

        # Create walls (2 * player count) forming a regular polygon
        self.walls = [
            {
                "x": round((MultiplayerPong.WALL_DISTANCE + ((i + 1) % 2)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((MultiplayerPong.WALL_DISTANCE + ((i + 1) % 2)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": wall_wdith,  # Long enough to form a closed arena
                "height": MultiplayerPong.WALL_HEIGHT,  # Thin walls
            }
            for i in range(2 * self.player_count)
        ]

        if self.player_count > 2: # Adds a small wall in between players to provide more bounces
            self.walls += [
                {
                    "x": round((MultiplayerPong.WALL_DISTANCE * 3.0 / 5.0) * math.cos(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "y": round((MultiplayerPong.WALL_DISTANCE * 3.0 / 5.0) * math.sin(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "alpha": round(math.pi + math.pi * (i + 1.0) / self.player_count, ndigits=3),
                    "width": MultiplayerPong.WALL_HEIGHT / 2.5,  # Long enough to form a closed arena
                    "height": wall_wdith / 4.5,  # Thin walls
                }
                for i in range(0, 2 * self.player_count, 2)
            ]

        # Create paddles centered on every other wall
        self.player_paddles = [
            {
                "x": round((MultiplayerPong.WALL_DISTANCE - (MultiplayerPong.PADDLE_OFFSET)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((MultiplayerPong.WALL_DISTANCE - (MultiplayerPong.PADDLE_OFFSET)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": MultiplayerPong.PADDLE_WIDTH,
                "height": MultiplayerPong.PADDLE_HEIGHT,
            }
            for i in range(0, 2 * self.player_count, 2)
        ]

        print(f"player paddles:")
        for i, paddle in enumerate(self.player_paddles):
            tmp = math.sqrt(paddle["x"]**2 + paddle["y"]**2)
            if tmp != 0:
                paddle["nx"] = - paddle["x"] / tmp
                paddle["ny"] = - paddle["y"] / tmp

            paddle["x"] += MultiplayerPong.WALL_DISTANCE
            paddle["y"] += MultiplayerPong.WALL_DISTANCE

            paddle["dx"] = paddle["ny"]
            paddle["dy"] = - paddle["nx"]
            print(f"  |- {i}: {paddle}")

        print(f"walls:")
        for i, wall in enumerate(self.walls):
            tmp = math.sqrt(wall["x"]**2 + wall["y"]**2)
            if tmp != 0:
                wall["nx"] = - wall["x"] / tmp
                wall["ny"] = - wall["y"] / tmp

            wall["x"] += MultiplayerPong.WALL_DISTANCE
            wall["y"] += MultiplayerPong.WALL_DISTANCE

            wall["dx"] = wall["ny"]
            wall["dy"] = - wall["nx"]
            print(f"  |- {i}: {wall}")

    def update(self):
        """Calulcate the next game state"""
        PongPhysicsEngine.do_collision_check(self.ball, self)
        super().trigger_modifiers("on_update")

    def handle_action(self, action):
        """Handle client action"""
        print(f"Received action: {action}")

        # Handle paddle movement action
        # Handle use_modifier action
        #    -> handle ping compensation

        pass

    def get_state_snapshot(self):
        """Returns the current game state"""
        game_state = super().get_state_snapshot()

        game_state["ball"] = self.ball
        game_state["player_paddles"] = self.player_paddles
        game_state["walls"] = self.walls
        return game_state

    def load_state_snapshot(self, snapshot):
        self.ball = snapshot["ball"]
        self.player_paddles = snapshot["player_paddles"]

    def reset_ball(self, direction=1):
        """Reset ball position and speed."""
        self.ball = {
            "x": 50,
            "y": 50,
            "dx": 1,
            "dy": 0,
            "speed": 3,
        }
