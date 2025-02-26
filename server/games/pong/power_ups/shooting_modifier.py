import math
from ..pong_modifier_base import PongModifierBase
from ..multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY


class ShootingModifier(PongModifierBase):
    name = "shooting_modifier"

    def __init__(self, player_id):
        if not player_id:
            print(f"No player_id given")
            raise ValueError

        super().__init__()

        self.player_id = player_id
        print(f"Shooting power_up picked up by: {self.player_id}")

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]

        self.ramp_up_strength = GAME_REGISTRY["pong"]["power_ups"][self.name]["ramp_up_strength"]
        self.half_opening_deg = GAME_REGISTRY["pong"]["power_ups"][self.name]["half_opening_deg"]
        self.angular_speed_deg_tick = GAME_REGISTRY["pong"]["power_ups"][self.name]["angular_speed_deg_tick"]

        self.ball_speed = 0.0
        self.player_speed = 0.0
        self.shooting_angle = 0.0
        self.velocity = 0.0
        self.half_opening_rad = math.radians(self.half_opening_deg)
        self.angular_speed_rad_tick = math.radians(self.angular_speed_deg_tick)

    def on_paddle_bounce(self, game, player_id=-1):
        """Activate the power_up if bounced on the player that picked it up (self.player_id)"""
        if  not self.player_id == player_id or \
            self.active:
            return

        self.activate(game, self.player_id)

    def on_activation(self, game: MultiplayerPong):
        super().on_activation(game)

        self.ball_speed = game.balls[0]["speed"]
        game.balls[0]["speed"] = 0.0

        self.player_speed = game.player_paddles[self.player_id]["speed"]
        game.player_paddles[self.player_id]["speed"] = 0.0

    def on_user_input(self, game, input):
        """On user input, update shooting angle"""
        if not self.active:
            return

        match(input['action']):
            case 'UP':
                self.velocity = self.angular_speed_rad_tick

            case 'DOWN':
                self.velocity = -self.angular_speed_rad_tick

            case 'STOP':
                self.velocity = 0.0

    def on_update(self, game):
        if not self.active:
            return

        super().on_update(game)

        if self.velocity == 0.0:
            return

        direction = 1 if self.velocity > 0 else -1

        if  (direction > 0 and self.shooting_angle >= self.half_opening_rad) or \
            (direction < 0 and self.shooting_angle <= self.half_opening_rad):
            return

        self.shooting_angle += self.velocity

    def on_deactivation(self, game: MultiplayerPong, player_id=-1):
        super().on_deactivation(game, player_id)

        game.balls[0]["speed"] = (1.0 + self.ramp_up_strength) * self.ball_speed

        final_angle = (game.player_paddles[self.player_id]["alpha"] - self.shooting_angle)
        ca, sa = math.cos(final_angle), math.sin(final_angle)
        game.balls[0]["dx"] = ca
        game.balls[0]["dy"] = sa

        game.player_paddles[self.player_id]["speed"] = self.player_speed

        game.power_up_manager.deactivate_power_up(self)

    def on_player_elimination(self, game, player_id):
        if not self.active:
            return

        super().on_player_elimination(game, player_id)

        if player_id == self.player_id:
        	self.deactivate(game)

