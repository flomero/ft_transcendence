from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong


class DefaultSurvivalGameModifier(PongModifierBase):
    name = "default_survival_game_modifier"

    def __init__(self):
        super().__init__()

    def on_goal(self, game: MultiplayerPong, player_id=-1):
        """Check if there's only 1 remaining player, if so he won -> stop the game"""
        survivors = [id for id in game.results if id == 0]
        if len(survivors) == 1:
            print(f"Only one survivor: {survivors[0]}\n  |--> ending the game.")
            game.start_game = False

