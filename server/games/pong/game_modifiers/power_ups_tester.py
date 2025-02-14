from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY


class PowerUpsTester(PongModifierBase):
    name = "power_ups_tester"

    def __init__(self):
        super().__init__()

    def on_power_up_pickup(self, game: MultiplayerPong, power_up, player_id=-1):
        """Automatically trigger a power_up when picked up to test it's effect"""

        print(f"Picked up a power_up: {power_up}")
        game.power_up_manager.active_power_ups.append(GAME_REGISTRY['pong']['power_ups'][power_up["type"]]["class"]())
        game.power_up_manager.active_power_ups[-1].activate(game, player_id)
