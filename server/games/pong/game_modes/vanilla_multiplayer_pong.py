import math
from games.pong.multiplayer_pong import MultiplayerPong


class VanillaMultiplayerPong(MultiplayerPong):

    name = "vanilla_multiplayer_pong"

    WALL_HEIGHT = 2
    WALL_DISTANCE = 50  # Distance from the center to walls
    PADDLE_OFFSET = 2 + WALL_HEIGHT / 2.0   # Gap between paddle and wall
    PADDLE_PERCENT = 25  # percentage of the goal the paddle should cover
    PADDLE_HEIGHT = 1  # Paddle height

    def __init__(self, player_count=4, modifiers=None):
        super().__init__(player_count, modifiers)

        self.ball = {
                "x": 50,
                "y": 50,
                "dx": 2,
                "dy": 1,
                "speed": 1.25,
                "size": 0.75,
            }
        tmp = math.sqrt(self.ball["dx"]**2 + self.ball["dy"]**2)
        self.ball["dx"] /= tmp
        self.ball["dy"] /= tmp

        print(f"ball: {self.ball}")

        wall_wdith = 2.0 * math.sin(math.pi / (2.0 * self.player_count)) * (VanillaMultiplayerPong.WALL_DISTANCE * (1 + 1 / (player_count + 0.5)))

        # Create walls (2 * player count) forming a regular polygon
        self.walls = [
            {
                "x": round((VanillaMultiplayerPong.WALL_DISTANCE - (VanillaMultiplayerPong.WALL_HEIGHT * ((i) % 2) * 1.0)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((VanillaMultiplayerPong.WALL_DISTANCE - (VanillaMultiplayerPong.WALL_HEIGHT * ((i) % 2) * 1.0)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": wall_wdith,  # Long enough to form a closed arena
                "height": VanillaMultiplayerPong.WALL_HEIGHT,  # Thin walls
            }
            for i in range(2 * self.player_count)
        ]

        if self.player_count > 2: # Adds a small wall in between players to provide more bounces
            self.walls += [
                {
                    "x": round((VanillaMultiplayerPong.WALL_DISTANCE * 3.0 / 5.0) * math.cos(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "y": round((VanillaMultiplayerPong.WALL_DISTANCE * 3.0 / 5.0) * math.sin(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "alpha": round(math.pi + math.pi * (i + 1.0) / self.player_count, ndigits=3),
                    "width": VanillaMultiplayerPong.WALL_HEIGHT / 2.5,  # Long enough to form a closed arena
                    "height": wall_wdith / 4.5,  # Thin walls
                }
                for i in range(0, 2 * self.player_count, 2)
            ]

        paddle_width = (VanillaMultiplayerPong.WALL_DISTANCE - VanillaMultiplayerPong.PADDLE_OFFSET) * math.sin(math.pi / self.player_count) * (VanillaMultiplayerPong.PADDLE_PERCENT / 100.0)

        # Create paddles centered on every other wall
        self.player_paddles = [
            {
                "x": round((VanillaMultiplayerPong.WALL_DISTANCE - (VanillaMultiplayerPong.PADDLE_OFFSET)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((VanillaMultiplayerPong.WALL_DISTANCE - (VanillaMultiplayerPong.PADDLE_OFFSET)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": paddle_width,
                "height": VanillaMultiplayerPong.PADDLE_HEIGHT,
            }
            for i in range(0, 2 * self.player_count, 2)
        ]

        print(f"player paddles:")
        for i, paddle in enumerate(self.player_paddles):
            tmp = math.sqrt(paddle["x"]**2 + paddle["y"]**2)
            if tmp != 0:
                paddle["nx"] = - paddle["x"] / tmp
                paddle["ny"] = - paddle["y"] / tmp

            paddle["x"] += VanillaMultiplayerPong.WALL_DISTANCE
            paddle["y"] += VanillaMultiplayerPong.WALL_DISTANCE

            paddle["dx"] = paddle["ny"]
            paddle["dy"] = - paddle["nx"]
            print(f"  |- {i}: {paddle}")

        print(f"walls:")
        for i, wall in enumerate(self.walls):
            tmp = math.sqrt(wall["x"]**2 + wall["y"]**2)
            if tmp != 0:
                wall["nx"] = - wall["x"] / tmp
                wall["ny"] = - wall["y"] / tmp

            wall["x"] += VanillaMultiplayerPong.WALL_DISTANCE
            wall["y"] += VanillaMultiplayerPong.WALL_DISTANCE

            wall["dx"] = wall["ny"]
            wall["dy"] = - wall["nx"]
            print(f"  |- {i}: {wall}")