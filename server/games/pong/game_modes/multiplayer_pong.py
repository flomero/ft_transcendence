import time
import math

from games.game_base import GameBase
from games.pong.pong_physics_engine import PongPhysicsEngine
from games.pong.modifiers.pong_modifier_base import PongModifierBase


class MultiplayerPong(GameBase):
    """Multiplayer pong"""

    name = "multiplayer_pong"

    WALL_DISTANCE = 50  # Distance from the center to walls
    PADDLE_OFFSET = 3   # Gap between paddle and wall
    PADDLE_WIDTH = 5    # Paddle width
    PADDLE_HEIGHT = 15  # Paddle height

    def __init__(self, player_count=2, modifiers=None):
        super().__init__(modifiers)

        self.last_player_hit = None
        self.player_count = player_count
        self.ball = {
                "x": 50,
                "y": 50,
                "dx": 2,
                "dy": 1,
                "speed": 3,
            }
        tmp = math.sqrt(self.ball["dx"]**2 + self.ball["dy"]**2)
        self.ball["dx"] /= tmp
        self.ball["dy"] /= tmp

        print(f"ball: {self.ball}")


        # Create walls (2 * player count) forming a regular polygon
        self.walls = [
            {
                "x": round(MultiplayerPong.WALL_DISTANCE * math.sin(math.pi * i / self.player_count) + MultiplayerPong.WALL_DISTANCE),
                "y": round(MultiplayerPong.WALL_DISTANCE * math.cos(math.pi * i / self.player_count) + MultiplayerPong.WALL_DISTANCE),
                "dx": round(-math.cos(math.pi * i / self.player_count)),
                "dy": round(math.sin(math.pi * i / self.player_count)),
                "width": MultiplayerPong.WALL_DISTANCE * 2,  # Long enough to form a closed arena
                "height": 1,  # Thin walls
            }
            for i in range(2 * self.player_count)
        ]

        # Create paddles centered on every other wall
        self.player_paddles = [
            {
                "x": round((MultiplayerPong.WALL_DISTANCE - MultiplayerPong.PADDLE_OFFSET) * math.sin(math.pi * (2 * i + 1) / self.player_count) + MultiplayerPong.WALL_DISTANCE),
                "y": round((MultiplayerPong.WALL_DISTANCE - MultiplayerPong.PADDLE_OFFSET) * math.cos(math.pi * (2 * i + 1) / self.player_count) + MultiplayerPong.WALL_DISTANCE),
                "dx": round(-math.cos(math.pi * (2 * i + 1) / self.player_count)),
                "dy": round(math.sin(math.pi * (2 * i + 1) / self.player_count)),
                "width": MultiplayerPong.PADDLE_WIDTH,
                "height": MultiplayerPong.PADDLE_HEIGHT,
            }
            for i in range(self.player_count)
        ]

        print(f"player paddles:")
        for i in range(self.player_count):
            print(f"  |- {i}: {self.player_paddles[i]}")

        print(f"walls:")
        for i in range(2*self.player_count):
            print(f"  |- {i}: {self.walls[i]}")

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
