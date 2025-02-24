from ...modifier_base import ModifierBase
from ..multiplayer_pong import MultiplayerPong


class DefaultLastHitTrackerGameModifier(ModifierBase):
    name = "default_last_hit_tracker_game_modifier"

    def __init__(self):
        super().__init__()

    def on_paddle_bounce(self, game: MultiplayerPong, player_id):
        game.last_player_hit = player_id