import math
from ..pong_time_limited_modifier_base import PongTimeLimitedModifierBase
from ...game_registry import GAME_REGISTRY
from ..multiplayer_pong import MultiplayerPong


class BlackHoleDebuffModifier(PongTimeLimitedModifierBase):
    name = "black_hole_debuff_modifier"

    def __init__(self):
        super().__init__()

        self.spawn_weight = GAME_REGISTRY["pong"]["power_ups"][self.name]["spawn_weight"]
        self.duration = GAME_REGISTRY["pong"]["power_ups"][self.name]["duration"]

        self.debuff_count = GAME_REGISTRY["pong"]["power_ups"][self.name]["debuff_count"]
        self.pull_strength = GAME_REGISTRY["pong"]["power_ups"][self.name]["pull_strength"]   # in %
        self.pull_range = GAME_REGISTRY["pong"]["power_ups"][self.name]["pull_range"]         # in % of the arena_radius

        self.affected_players = []


    def on_activation(self, game: MultiplayerPong):
        super().on_activation(game)

        self.effective_pull_range = game.wall_distance * self.pull_range / 100.0

        # Select the debuff_count players to affect

        max_goals = max(game.player_goals)
        pdf = [
            (max_goals + 1) - goals
            for goals in game.player_goals
        ]

        total_density = sum(pdf)
        pdf = [p/total_density for p in pdf]

        cumul = 0.0
        cdf = []
        for p in pdf:
            cumul += p
            cdf.append(cumul)

        # Select affected players
        for _ in range(self.debuff_count):
            rnd = game.rng.random()
            for id, c in enumerate(cdf):
                if rnd < c:
                    self.affected_players.append(id)
                    break

        print(f"Affected players: {self.affected_players}")

    def on_update(self, game: MultiplayerPong):
        """If in range, pulls the main ball towards the player(s) acting as a black hole."""
        ball = game.balls[0]

        # Get the current full velocity vector (velocity components scaled by speed)
        vx = ball["dx"] * ball["speed"]
        vy = ball["dy"] * ball["speed"]

        # We'll accumulate attraction from all players in range.
        total_attraction_x = 0
        total_attraction_y = 0

        for player_id in self.affected_players:
            paddle = game.player_paddles[player_id]

            # Compute vector from the ball to the player (the "black hole")
            dx = paddle["x"] - ball["x"]
            dy = paddle["y"] - ball["y"]

            # Check if the ball is in range (using squared distances for efficiency)
            dist_sq = dx**2 + dy**2
            if not dist_sq < (ball["size"]**2 + self.effective_pull_range**2):
                continue

            # Normalize the direction (avoid division by zero)
            dist = math.sqrt(dist_sq)
            if dist == 0:
                continue
            norm_dx = dx / dist
            norm_dy = dy / dist

            # Compute the attraction vector.
            # The magnitude of the pull is pull_strength * current speed.
            attraction_x = ball["speed"] * norm_dx * self.pull_strength / 100.0
            attraction_y = ball["speed"] * norm_dy * self.pull_strength / 100.0

            total_attraction_x += attraction_x
            total_attraction_y += attraction_y

        # If any attraction was applied, update the ball's velocity.
        if total_attraction_x != 0 or total_attraction_y != 0:
            # Add the attraction to the current velocity vector.
            new_vx = vx + total_attraction_x
            new_vy = vy + total_attraction_y

            # Compute the new speed (magnitude) and update the unit direction.
            new_speed = math.sqrt(new_vx**2 + new_vy**2)
            if new_speed > 0:
                ball["dx"] = new_vx / new_speed
                ball["dy"] = new_vy / new_speed
                ball["speed"] = new_speed

    def on_player_elimination(self, game, player_id):
        """Remove black_hole from eliminated players"""

        if player_id in self.affected_players:
            self.affected_players.remove(player_id)
            if len(self.affected_players) <= 0:
                self.deactivate(game)

    def on_deactivation(self, game: MultiplayerPong):
        super().on_deactivation(game)

        game.power_up_manager.deactivate_power_up(self)
