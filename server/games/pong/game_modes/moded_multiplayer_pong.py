import math
import random
from games.pong.multiplayer_pong import MultiplayerPong
from ...game_base import GAME_REGISTRY


class ModedMultiplayerPong(MultiplayerPong):

    name = "moded_multiplayer_pong"

    WALL_HEIGHT = 2
    WALL_DISTANCE = 50  # Distance from the center to walls
    PADDLE_OFFSET = 2 + WALL_HEIGHT / 2.0   # Gap between paddle and wall
    PADDLE_PERCENT = 25  # percentage of the goal the paddle should cover
    PADDLE_HEIGHT = 1  # Paddle height

    def __init__(self, player_count=4, modifiers=None, power_ups=None):
        super().__init__(player_count, modifiers)

        self.power_ups_names = power_ups
        self.available_power_ups = [
            GAME_REGISTRY["pong"]["power_ups"][power_up]
            for power_up in GAME_REGISTRY["pong"]["power_ups"]
            if power_up in self.power_ups_names
        ]

        self.power_ups_pdf = [
            power_up["spawn_weight"] + 0.0
            for power_up in self.available_power_ups
        ]
        self.total_power_ups_weight = sum(self.power_ups_pdf)
        self.power_ups = []
        self.active_power_ups = []
        self.power_ups_cdf = []
        self.init_power_ups()

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


    def init_power_ups(self):
        """Normalizes the power_ups weights and computes the cdf"""
        if self.total_power_ups_weight == 0.0:
            print(f"No power_ups -> no initialization")
            return

        # Normalize the Probabilistic Density Function
        self.power_ups_pdf = [p / self.total_power_ups_weight for p in self.power_ups_pdf]

        # Compute the Cumulative Density Function
        cumul = 0.0
        for p in self.power_ups_pdf:
            cumul += p
            self.power_ups_cdf.append(cumul)

    def spawn_power_up(self, position: tuple):
        """Spawns a power_up at the designated position"""

        rnd = random.random()
        for i, cumul_val in enumerate(self.power_ups_cdf):
            if rnd < cumul_val:
                self.power_ups.append(
                    {
                        "x": position[0],
                        "y": position[1],
                        "size": 1.75,
                        "object_type": self.power_ups_names[i],
                        "visible": True
                    }
                )
                self.trigger_modifiers("on_power_up_spawn", power_up=self.power_ups[-1])
                break


    def get_state_snapshot(self):
        snapshot = super().get_state_snapshot()

        snapshot["power_ups"] = self.power_ups
        return snapshot
