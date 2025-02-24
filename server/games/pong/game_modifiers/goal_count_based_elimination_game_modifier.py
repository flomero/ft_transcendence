from ...modifier_base import ModifierBase
from ...game_registry import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong


class GoalCountBasedEliminationGameModifier(ModifierBase):
    name = "goal_count_based_elimination_game_modifier"

    def __init__(self):
        super().__init__()

        self.life_count = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["life_count"]

    def on_goal(self, game: MultiplayerPong, player_id=-1):
        """On goal eliminates players that have reached life_count"""

        if game.player_goals[player_id] >= self.life_count:
            game.results[player_id] = len(
                [
                    goals
                    for goals in game.player_goals
                    if goals < self.life_count
                ]
            )
            game.trigger_modifiers('on_player_elimination', player_id=player_id)