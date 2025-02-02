from games.game_base import GameBase
from games.pong.physics_engines.multiplayer_pong_physics_engine import MultiplayerPongPhysicsEngine


class MultiplayerPong(GameBase):
    """Multiplayer pong"""

    name = "multiplayer_pong"

    def __init__(self, player_count=2, modifiers=None):
        super().__init__(modifiers)

        self.modifiers = modifiers
        self.player_count = player_count

        self.last_player_hit = None
        self.ball = None
        self.walls = None
        self.player_paddles = None

    def update(self):
        """Calulcate the next game state"""
        MultiplayerPongPhysicsEngine.do_collision_check(self.ball, self)
        super().trigger_modifiers("on_update")

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

        game_state["ball"] = self.ball
        game_state["player_paddles"] = self.player_paddles
        game_state["walls"] = self.walls
        return game_state

    def load_state_snapshot(self, snapshot):
        self.ball = snapshot["ball"]
        self.player_paddles = snapshot["player_paddles"]

    def reset_ball(self, direction=1):
        """Reset ball position and speed."""
        self.ball = {
            "x": 50,
            "y": 50,
            "dx": 1,
            "dy": 0,
            "speed": 3,
        }
