import math
import random
from games.pong.multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY


class ModedMultiplayerPong(MultiplayerPong):

    name = "moded_multiplayer_pong"

    WALL_HEIGHT = 2
    WALL_DISTANCE = 50  # Distance from the center to walls
    PADDLE_OFFSET = 2 + WALL_HEIGHT / 2.0   # Gap between paddle and wall
    PADDLE_PERCENT = 25  # percentage of the goal the paddle should cover
    PADDLE_HEIGHT = 1  # Paddle height

    def __init__(self, player_count=4, modifiers=[], power_ups=[]):
        super().__init__(player_count, modifiers, power_ups)

        random_angle = random.random() * math.pi * 2.0
        ca, sa = math.cos(random_angle), math.sin(random_angle)
        self.balls.append(
            {
                "x": 50 + 2.0 * ca,
                "y": 50 + 2.0 * sa,
                "dx": ca,
                "dy": sa,
                "speed": 2,
                "size": 0.75,
                "visible": True,
                "do_collision": True,
                "do_goal": True
            }
        )
        tmp = math.sqrt(self.balls[0]["dx"]**2 + self.balls[0]["dy"]**2)
        self.balls[0]["dx"] /= tmp
        self.balls[0]["dy"] /= tmp

        wall_wdith = 2.0 * math.sin(math.pi / (2.0 * self.player_count)) * (self.WALL_DISTANCE * (1 + 1 / (player_count + 0.5)))

        # Create walls (2 * player count) forming a regular polygon
        self.walls = [
            {
                "x": round((self.WALL_DISTANCE - (self.WALL_HEIGHT * ((i) % 2) * 1.0)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((self.WALL_DISTANCE - (self.WALL_HEIGHT * ((i) % 2) * 1.0)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": wall_wdith,  # Long enough to form a closed arena
                "height": self.WALL_HEIGHT,  # Thin walls
                "visible": True
            }
            for i in range(2 * self.player_count)
        ]

        if self.player_count > 2: # Adds a small wall in between players to provide more bounces
            self.walls += [
                {
                    "x": round((self.WALL_DISTANCE * 3.0 / 5.0) * math.cos(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "y": round((self.WALL_DISTANCE * 3.0 / 5.0) * math.sin(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "alpha": round(math.pi + math.pi * (i + 1.0) / self.player_count, ndigits=3),
                    "width": self.WALL_HEIGHT / 2.5,
                    "height": wall_wdith / 6.5,  # Thin walls
                    "visible": True
                }
                for i in range(0, 2 * self.player_count, 2)
            ]

        paddle_width = (self.WALL_DISTANCE - self.PADDLE_OFFSET) * math.sin(math.pi / self.player_count) * (self.PADDLE_PERCENT / 100.0)

        # Create paddles centered on every other wall
        self.player_paddles = [
            {
                "x": round((self.WALL_DISTANCE - (self.PADDLE_OFFSET)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((self.WALL_DISTANCE - (self.PADDLE_OFFSET)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": paddle_width,
                "height": self.PADDLE_HEIGHT,
                "visible": True
            }
            for i in range(0, 2 * self.player_count, 2)
        ]

        for i, paddle in enumerate(self.player_paddles):
            tmp = math.sqrt(paddle["x"]**2 + paddle["y"]**2)
            if tmp != 0:
                paddle["nx"] = - paddle["x"] / tmp
                paddle["ny"] = - paddle["y"] / tmp

            paddle["x"] += self.WALL_DISTANCE
            paddle["y"] += self.WALL_DISTANCE

            paddle["dx"] = paddle["ny"]
            paddle["dy"] = - paddle["nx"]

        for i, wall in enumerate(self.walls):
            tmp = math.sqrt(wall["x"]**2 + wall["y"]**2)
            if tmp != 0:
                wall["nx"] = - wall["x"] / tmp
                wall["ny"] = - wall["y"] / tmp

            wall["x"] += self.WALL_DISTANCE
            wall["y"] += self.WALL_DISTANCE

            wall["dx"] = wall["ny"]
            wall["dy"] = - wall["nx"]

        self.walls.append(
            {
                "x": self.WALL_DISTANCE,
                "y": self.WALL_DISTANCE,
                "alpha": math.pi / 4.0,
                "width": 1.0,
                "height": 1.0,
                "visible": True,
                "nx": math.sin(math.pi / 4.0),
                "ny": math.cos(math.pi / 4.0),
                "dx": math.cos(math.pi / 4.0),
                "dy": -math.sin(math.pi / 4.0),
            }
        )

    def get_state_snapshot(self):
        snapshot = super().get_state_snapshot()

        snapshot["power_ups"] = self.power_up_manager.spawned_power_ups
        return snapshot
