from ..pong_modifier_base import PongModifierBase
from ...game_registry import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong


class GraspingVinesDebuffModifier(PongModifierBase):
    name = "grasping_vines_debuff_modifier"

    def __init__(self, player_id):
        super().__init__()

        self.player_id = player_id

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]

        self.max_vines = GAME_REGISTRY["pong"]["power_ups"][self.name]["max_vines"]
        self.vine_frequency = GAME_REGISTRY["pong"]["power_ups"][self.name]["vine_frequency"]     # nb of ticks to spawn a vine
        self.vine_strength = GAME_REGISTRY["pong"]["power_ups"][self.name]["vine_strength"]       # % of slow per vine

        self.vine_count = None
        self.player_speeds = None

    def on_activation(self, game: MultiplayerPong):
        super().on_activation(game)

        self.vine_count = [0] * game.player_count
        self.vine_count[self.player_id] = -1

        self.player_speeds = [
            player_paddle["speed"]
            for player_paddle in game.player_paddles
        ]

    def on_update(self, game: MultiplayerPong):
        super().on_update(game)

        if (self.ticks % self.vine_frequency) == 0:
            self.vine_count = [
                vines + 1
                if 0 <= vines < self.max_vines
                else vines
                for vines in self.vine_count
            ]

            for k in range(game.player_count):
                self.update_player_speed(game, k)

    def on_player_movement(self, game: MultiplayerPong, player_id):
        """Remove 1 vine per movement"""

        if  player_id != self.player_id and \
            self.vine_count[player_id] > 0:
            self.vine_count[player_id] -= 1

            self.update_player_speed(game, player_id)


    def update_player_speed(self, game: MultiplayerPong, player_id):
        """Updates player_id's speed depending on it's vine count"""

        if player_id not in range(game.player_count):
            print(f"player id {player_id} not in range [0; {game.player_count}[")
            return

        game.player_paddles[player_id]["speed"] = self.player_speeds[player_id] * (1.0 - self.vine_count[player_id] * self.vine_strength / 100.0)

    def on_deactivation(self, game: MultiplayerPong):
        super().on_deactivation(game)

        game.power_up_manager.deactivate_power_up(self)

