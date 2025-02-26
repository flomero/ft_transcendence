from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY


class DefaultTimeLimitedGameModifier(PongModifierBase):
    name = "default_time_limited_game_modifier"

    def __init__(self):
        super().__init__()

        self.duration = GAME_REGISTRY["pong"]["game_modifiers"][self.name]["duration"] * 30

    def on_update(self, game):
        super().on_update(game)

        print(f"time remaining: {self.ticks} / {self.duration}")

    def on_game_start(self, game):
        self.activate(game)

    def on_deactivation(self, game: MultiplayerPong):
        game.start_game = False