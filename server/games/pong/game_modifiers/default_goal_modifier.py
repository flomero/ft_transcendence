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

        if game.player_goals[player_id] >= 3:
            game.player_paddles[player_id]["visible"] = False
            game.results[player_id] = len(
                [
                    id
                    for id, paddle in enumerate(game.player_paddles)
                    if paddle["visible"]
                ]
            )

        game.reset_ball(ball_id=0)