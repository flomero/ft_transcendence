import math
from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong
from games.modifiers_utils import compute_reset_angle


class DefaultGoalModifier(PongModifierBase):
    name = "default_goal_modifier"

    def __init__(self):
        super().__init__()


    def on_goal(self, game: MultiplayerPong, player_id=-1):
        """Handle goal counting & ball reset"""

        if not player_id in range(game.player_count):
            print(f"on_goal triggered w/ player id {player_id} when the game has {game.player_count} players")
            return

        game.player_goals[player_id] += 1
        print("Scores:")
        for k in range(game.player_count):
            print(f"  |- player {k}: {game.player_goals[k]}")
        print()

        if game.player_goals[player_id] >= 3:
            print(f"Player {player_id} lost, removing it's paddle")
            game.player_paddles[player_id]["visible"] = False
            game.results[player_id] = len(
                [
                    id
                    for id, paddle in enumerate(game.player_paddles)
                    if paddle["visible"]
                ]
            )
            print(f"current results: {game.results}")

        random_angle = compute_reset_angle(game.player_count, player_id) + game.player_paddles[player_id]["alpha"]
        ca, sa = math.cos(random_angle), math.sin(random_angle)

        game.ball["x"] = 50 + 2.0 * ca
        game.ball["y"] = 50 + 2.0 * sa
        game.ball["dx"] = ca
        game.ball["dy"] = sa