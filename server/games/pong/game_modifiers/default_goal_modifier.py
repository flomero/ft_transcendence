import math
from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY
from games.modifiers_utils import compute_reset_angle


class DefaultGoalModifier(PongModifierBase):
    name = "default_goal_modifier"

    def __init__(self):
        super().__init__()

        self.lives_count = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["lives_count"]


    def on_goal(self, game: MultiplayerPong, player_id=-1):
        """Handle goal counting & ball reset"""

        if not player_id in range(game.player_count):
            print(f"on_goal triggered w/ player id {player_id} when the game has {game.player_count} players")
            return

        game.player_goals[player_id] += 1

        if game.player_goals[player_id] >= self.lives_count:
            game.results[player_id] = len(
                [
                    goals
                    for goals in game.player_goals
                    if goals < self.lives_count
                ]
            )
            game.trigger_modifiers('on_player_elimination', player_id=player_id)

        game.reset_ball(ball_id=0)
