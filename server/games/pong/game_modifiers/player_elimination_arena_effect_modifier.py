import math
from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong


class PlayerEliminationArenaEffectModifier(PongModifierBase):
    name = "player_elimination_arena_effect_modifier"

    def __init__(self):
        super().__init__()

        self.walls = []

    def on_player_elimination(self, game: MultiplayerPong, player_id):
        """Modify the arena"""

        # Remove the player's paddle
        game.player_paddles[player_id]["visible"] = False

        # Get the goal_wall & 2 surrounding walls
        wall_ids = [
            ((2 * player_id + k) % (2 * game.player_count))
            for k in range(1, -2, -1)
        ]

        self.walls = [
            game.walls[id]
            for id in wall_ids
        ]

        leftmost = {
            "x": self.walls[0]["x"],
            "y": self.walls[0]["y"],
        }

        rightmost = {
            "x": self.walls[2]["x"],
            "y": self.walls[2]["y"],
        }

        self.walls.append({
            "x": (leftmost["x"] + rightmost["x"]) / 2.0,
            "y": (leftmost["y"] + rightmost["y"]) / 2.0,
            "alpha": self.walls[1]["alpha"],
            "width": math.sqrt((rightmost["x"] - leftmost["x"])**2 + (rightmost["y"] - leftmost["y"])**2),
            "height": self.walls[1]["height"],
            "visible": True,
            "dx": self.walls[1]["dx"],
            "dy": self.walls[1]["dy"],
        })

        game.walls[wall_ids[0]]["width"] /= 1.05
        game.walls[wall_ids[1]] = self.walls[-1]
        game.walls[wall_ids[2]]["width"] /= 1.05


