from ...modifier_base import ModifierBase
from ..multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY


class DefaultGoalTrackerGameModifier(ModifierBase):
    name = "default_goal_tracker_game_modifier"

    def __init__(self):
        super().__init__()

    def on_goal(self, game: MultiplayerPong, player_id=-1):
        """Handle goal counting & ball reset"""

        if not player_id in range(game.player_count):
            print(f"on_goal triggered w/ player id {player_id} when the game has {game.player_count} players")
            return

        game.player_goals[player_id] += 1
        game.reset_ball(ball_id=0)
