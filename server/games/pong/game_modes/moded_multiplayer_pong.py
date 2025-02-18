import math
import random
from games.pong.multiplayer_pong import MultiplayerPong
from ...game_registry import GAME_REGISTRY


class ModedMultiplayerPong(MultiplayerPong):

    name = "moded_multiplayer_pong"

    def __init__(self, player_count=4, modifiers=[], power_ups=[]):
        super().__init__(self.name, player_count, modifiers, power_ups)

        self.wall_distance = GAME_REGISTRY["pong"]["game_modes"][self.name]["arena_settings"]["wall_distance"]
        self.wall_height = GAME_REGISTRY["pong"]["game_modes"][self.name]["arena_settings"]["wall_height"]
        self.paddle_offset = GAME_REGISTRY["pong"]["game_modes"][self.name]["arena_settings"]["paddle_offset"] + self.wall_height / 2.0
        self.paddle_coverage = GAME_REGISTRY["pong"]["game_modes"][self.name]["arena_settings"]["paddle_coverage"]
        self.paddle_height = GAME_REGISTRY["pong"]["game_modes"][self.name]["arena_settings"]["paddle_height"]

        self.default_ball_speed = GAME_REGISTRY["pong"]["game_modes"][self.name]["default_ball_settings"]["speed"]
        self.default_ball_size = GAME_REGISTRY["pong"]["game_modes"][self.name]["default_ball_settings"]["size"]

        self.reset_ball()

        self.init_paddles()
        self.init_walls()

    def init_paddles(self):
        """Compute initial paddle positions, rotated by alpha"""

        # Create paddles centered on every other wall
        paddle_amplitude = (self.wall_distance - self.paddle_offset) * math.sin(math.pi / self.player_count)
        self.player_paddles = [
            {
                "x": round((self.wall_distance - (self.paddle_offset)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((self.wall_distance - (self.paddle_offset)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "coverage": self.paddle_coverage,
                "width":  paddle_amplitude * (self.paddle_coverage / 100.0),
                "height": self.paddle_height,
                "speed":  paddle_amplitude * (self.paddle_speed_width_percent / 100.0),
                "displacement": 0.0,
                "visible": True,
                "do_move": True
            }
            for i in range(0, 2 * self.player_count, 2)
        ]

        for i, paddle in enumerate(self.player_paddles):
            tmp = math.sqrt(paddle["x"]**2 + paddle["y"]**2)
            if tmp != 0:
                paddle["nx"] = - paddle["x"] / tmp
                paddle["ny"] = - paddle["y"] / tmp

            paddle["x"] += self.wall_distance
            paddle["y"] += self.wall_distance

            paddle["dx"] = paddle["ny"]
            paddle["dy"] = - paddle["nx"]

    def init_walls(self):
        """Initialiazes the walls, rotate by alpha"""
        # Create walls (2 * player count) forming a regular polygon
        wall_wdith = 2.0 * math.sin(math.pi / (2.0 * self.player_count)) * (self.wall_distance * (1 + 1 / (self.player_count + 0.5)))
        self.walls = [
            {
                "x": round((self.wall_distance - (self.wall_height * ((i) % 2) * 1.0)) * math.cos(math.pi * i / self.player_count + math.pi), ndigits=3),
                "y": round((self.wall_distance - (self.wall_height * ((i) % 2) * 1.0)) * math.sin(math.pi * i / self.player_count + math.pi), ndigits=3),
                "alpha": round(math.pi + math.pi * i / self.player_count, ndigits=3),
                "width": wall_wdith,  # Long enough to form a closed arena
                "height": self.wall_height,  # Thin walls
                "visible": True
            }
            for i in range(2 * self.player_count)
        ]

        if self.player_count > 2: # Adds a small wall in between players to provide more bounces
            self.walls += [
                {
                    "x": round((self.wall_distance * 3.0 / 5.0) * math.cos(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "y": round((self.wall_distance * 3.0 / 5.0) * math.sin(math.pi * (i + 1.0) / self.player_count + math.pi), ndigits=3),
                    "alpha": round(math.pi + math.pi * (i + 1.0) / self.player_count, ndigits=3),
                    "width": self.wall_height / 2.5,
                    "height": wall_wdith / 6.5,  # Thin walls
                    "visible": True
                }
                for i in range(0, 2 * self.player_count, 2)
            ]

        for i, wall in enumerate(self.walls):
            tmp = math.sqrt(wall["x"]**2 + wall["y"]**2)
            if tmp != 0:
                wall["nx"] = - wall["x"] / tmp
                wall["ny"] = - wall["y"] / tmp

            wall["x"] += self.wall_distance
            wall["y"] += self.wall_distance

            wall["dx"] = wall["ny"]
            wall["dy"] = - wall["nx"]

        self.walls.append(
            {
                "x": self.wall_distance,
                "y": self.wall_distance,
                "alpha": math.pi / 4.0,
                "width": 1.0,
                "height": 1.0,
                "visible": True,
                "nx": math.sin(math.pi / 4.0),
                "ny": math.cos(math.pi / 4.0),
                "dx": math.cos(math.pi / 4.0),
                "dy": -math.sin(math.pi / 4.0),
            }
        )

    def rotate_paddles(self, alpha=0.0):
        paddle_amplitude = (self.wall_distance - self.paddle_offset) * math.sin(math.pi / self.player_count)

        for idx, paddle in enumerate(self.player_paddles):
            base_angle = math.pi + (2 * math.pi * idx) / self.player_count

            # Apply the rotation offset.
            new_angle = base_angle + alpha

            # Compute the base (un-displaced) position.
            base_x = (self.wall_distance - self.paddle_offset) * math.cos(new_angle)
            base_y = (self.wall_distance - self.paddle_offset) * math.sin(new_angle)

            # Compute the normal vector (pointing inward).
            norm = math.hypot(base_x, base_y)
            if norm != 0:
                paddle["nx"] = -base_x / norm
                paddle["ny"] = -base_y / norm

            # The paddle’s lateral movement direction is perpendicular to the normal.
            paddle["dx"] = paddle["ny"]
            paddle["dy"] = -paddle["nx"]

            # Get the current displacement (which is a percentage of the paddle's width).
            disp = paddle["displacement"] // self.paddle_speed_width_percent

            # Update the paddle’s position by adding the displacement offset along (dx, dy)
            final_x = base_x + disp * paddle["dx"] * paddle["speed"]
            final_y = base_y + disp * paddle["dy"] * paddle["speed"]

            # Adjust for the arena's coordinate offset.
            paddle["x"] = round(final_x + self.wall_distance, 3)
            paddle["y"] = round(final_y + self.wall_distance, 3)

            # Update the paddle’s angle.
            paddle["alpha"] = round(new_angle, 3)

            # If needed, update width and speed based on the new amplitude.
            paddle["width"] = round(paddle_amplitude * (self.paddle_coverage / 100.0), 3)
            paddle["speed"] = round(paddle_amplitude * (self.paddle_speed_width_percent / 100.0), 3)

    def rotate_walls(self, alpha=0.0):
        """Rotates the walls"""
        # Compute the main wall width (same as in init_walls)
        wall_width = 2.0 * math.sin(math.pi / (2.0 * self.player_count)) * (
            self.wall_distance * (1 + 1 / (self.player_count + 0.5))
        )

        # --- Update the main walls (first 2*player_count walls) ---
        for i in range(2 * self.player_count):
            wall = self.walls[i]

            base_angle = math.pi + math.pi * i / self.player_count
            new_angle = base_angle + alpha

            factor = self.wall_distance - (self.wall_height * (i % 2))
            base_x = factor * math.cos(new_angle)
            base_y = factor * math.sin(new_angle)

            # Compute the normal vector (points inward)
            norm = math.hypot(base_x, base_y)
            if norm != 0:
                wall["nx"] = -base_x / norm
                wall["ny"] = -base_y / norm

            # Lateral direction (perpendicular to normal)
            wall["dx"] = wall["ny"]
            wall["dy"] = -wall["nx"]

            # Adjust the position with the arena's coordinate offset.
            wall["x"] = round(base_x + self.wall_distance, 3)
            wall["y"] = round(base_y + self.wall_distance, 3)
            wall["alpha"] = round(new_angle, 3)

            # Update dimensions (main walls)
            wall["width"] = round(wall_width, 3)
            wall["height"] = self.wall_height

        # --- Update the extra walls (if any) ---
        # These walls are added when player_count > 2.
        extra_walls_start = 2 * self.player_count
        extra_count = len(self.walls) - extra_walls_start
        if extra_count > 0:
            for j in range(extra_count):
                wall = self.walls[extra_walls_start + j]
                # In the extra walls, the original comprehension used:
                #   base_angle = math.pi * (i + 1.0) / self.player_count + math.pi,
                # where i in range(0, 2*player_count, 2). Recover that:
                i_val = j * 2  # i originally went 0, 2, 4, …
                base_angle = math.pi + math.pi * (i_val + 1.0) / self.player_count
                new_angle = base_angle + alpha

                # For extra walls, the radial distance is fixed at 3/5 of wall_distance.
                base_x = (self.wall_distance * 3.0 / 5.0) * math.cos(new_angle)
                base_y = (self.wall_distance * 3.0 / 5.0) * math.sin(new_angle)

                norm = math.hypot(base_x, base_y)
                if norm != 0:
                    wall["nx"] = -base_x / norm
                    wall["ny"] = -base_y / norm

                wall["dx"] = wall["ny"]
                wall["dy"] = -wall["nx"]

                wall["x"] = round(base_x + self.wall_distance, 3)
                wall["y"] = round(base_y + self.wall_distance, 3)
                wall["alpha"] = round(new_angle, 3)

                # Update dimensions for extra walls
                wall["width"] = round(self.wall_height / 2.5, 3)
                wall["height"] = round(wall_width / 6.5, 3)

    def get_state_snapshot(self):
        snapshot = super().get_state_snapshot()

        snapshot["power_up_manager"] = self.power_up_manager.get_state_snapshot()
        return snapshot

    def load_state_snapshot(self, snapshot):
        super().load_state_snapshot(snapshot)

        self.power_up_manager.load_state_snapshot(snapshot['power_up_manager'])

    def reset_ball(self, ball_id=-1):
        random_angle = self.rng.random() * math.pi * 2.0
        ca, sa = math.cos(random_angle), math.sin(random_angle)

        if not ball_id in range(len(self.balls)):
            self.balls = [
                {
                    "x": self.wall_distance + self.paddle_offset * ca,
                    "y": self.wall_distance + self.paddle_offset * sa,
                    "dx": ca,
                    "dy": sa,
                    "speed": self.default_ball_speed,
                    "size": self.default_ball_size,
                    "visible": True,
                    "do_collision": True,
                    "do_goal": True
                }
            ]
        else:
            self.balls[ball_id] = {
                    "x": self.wall_distance + self.paddle_offset * ca,
                    "y": self.wall_distance + self.paddle_offset * sa,
                    "dx": ca,
                    "dy": sa,
                    "speed": self.default_ball_speed,
                    "size": self.default_ball_size,
                    "visible": True,
                    "do_collision": True,
                    "do_goal": True
                }
