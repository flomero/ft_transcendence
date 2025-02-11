import math
import random
from games.game_base import GameBase
from games.physics_engine import PhysicsEngine


class MultiplayerPong(GameBase):
    """Multiplayer pong"""

    name = "multiplayer_pong"

    def __init__(self, player_count=4, modifiers=None):
        super().__init__(modifiers)

        # Players & related
        self.player_count = player_count
        self.player_goals = [0] * player_count
        self.results = [0] * player_count
        self.last_player_hit = None

        # Game objects -> w/ collisions
        self.balls = []
        self.walls = None
        self.player_paddles = None
        self.power_ups = None

    def update(self):
        """Calulcate the next game state"""
        if self.start_game:
            for ball in self.balls:
                if ball["do_collision"]:
                    PhysicsEngine.do_collision_check(ball, self)
            self.trigger_modifiers('on_update')

    def handle_action(self, action):
        """Handle client action"""
        print(f"Received action: {action}")

        # Handle paddle movement action
        # Handle use_modifier action
        #    -> handle ping compensation

        pass

    def get_state_snapshot(self):
        """Returns the current game state"""
        game_state = super().get_state_snapshot()

        game_state["balls"] = self.balls
        game_state["player_paddles"] = self.player_paddles
        game_state["walls"] = self.walls
        return game_state

    def load_state_snapshot(self, snapshot):
        self.ball = snapshot["ball"]
        self.player_paddles = snapshot["player_paddles"]

    def reset_ball(self):
        """Reset ball position and speed."""
        random_angle = random.random() * math.pi * 2.0
        ca, sa = math.cos(random_angle), math.sin(random_angle)

        # Reset all balls
        self.balls[0] = {
            "x": 50 + 2.0 * ca,
            "y": 50 + 2.0 * sa,
            "dx": ca,
            "dy": sa,
            "speed": 2,
            "size": 0.75,
            "visible": True,
            "do_collision": True,
            "do_goal": True
        }

