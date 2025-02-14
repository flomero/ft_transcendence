import math
import random
from games.game_base import GameBase
from games.physics_engine import PhysicsEngine

EPSILON = 1e-2

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
                    self.do_collision_checks(ball)
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

    def do_collision_checks(self, ball):
        """Moves the balls while handling precise collision resolution."""

        def get_closest_collision(collisions):
            min_index, min_value = -1, math.inf

            for k, collision in enumerate(collisions):
                if not collision:
                    continue

                if collision["distance"] < min_value:
                    min_value = collision["distance"]
                    min_index = k

            return collisions[min_index]

        remaining_distance = ball["speed"]
        loop_counter = 0

        while remaining_distance > EPSILON:
            paddle_collision = PhysicsEngine.detect_collision(ball, remaining_distance, self.player_paddles, "paddle")
            wall_collision = PhysicsEngine.detect_collision(ball, remaining_distance, self.walls, "wall")

            power_up_collision = None if not self.power_ups else PhysicsEngine.detect_collision(ball, remaining_distance, self.power_ups, "power_up")
            if not ball["do_goal"]:
                power_up_collision = None

            # Determine the closest collision
            collision = get_closest_collision([paddle_collision, wall_collision, power_up_collision])

            if collision:
                travel_distance = collision["distance"]
                ball["x"] += round(ball["dx"] * travel_distance, ndigits=2)
                ball["y"] += round(ball["dy"] * travel_distance, ndigits=2)

                if not collision["type"] == "power_up":
                    PhysicsEngine.resolve_collision(ball, collision)

                    # Handle modifiers
                    if collision["type"] == "paddle":
                        self.trigger_modifiers("on_paddle_bounce", player_id=collision["object_id"])
                    elif collision["type"] == "wall":
                        if  (collision["object_id"] % 2 == 0) and \
                            (collision["object_id"] in range(0, 2 * self.player_count, 2)) and \
                            self.player_paddles[(collision["object_id"] // 2)]["visible"] and \
                            ball["do_goal"]:  # Goal wall
                            self.trigger_modifiers("on_goal", player_id=(collision["object_id"] // 2))
                        else:
                            self.trigger_modifiers("on_wall_bounce")
                else:
                    # print(f"player {self.last_player_hit} took a power_up")
                    self.trigger_modifiers("on_power_up_pickup", power_up=self.power_ups[collision["object_id"]], player_id=self.last_player_hit)
                    self.power_ups.remove(self.power_ups[collision["object_id"]])

                remaining_distance -= travel_distance
            else:
                # Move ball normally if no collision
                ball["x"] += round(ball["dx"] * remaining_distance, ndigits=2)
                ball["y"] += round(ball["dy"] * remaining_distance, ndigits=2)
                break

            loop_counter += 1
            if loop_counter > (ball["speed"] * 3.0) + 1:
                break
