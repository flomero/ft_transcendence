import math
import random
import time
import asyncio
from collections import deque
from games.game_base import GameBase
from games.physics_engine import PhysicsEngine
from ..game_registry import GAME_REGISTRY

EPSILON = 1e-2

class MultiplayerPong(GameBase):
    """Multiplayer pong"""

    name = "multiplayer_pong"

    def __init__(self, game_mode, player_count=4, modifiers=[], power_ups=[]):
        super().__init__("pong", game_mode, modifiers, power_ups)

        # Server related
        self.server_tickrate_ms = GAME_REGISTRY["pong"]["server_tickrate_ms"]
        self.server_max_delay_ticks = GAME_REGISTRY["pong"]["server_max_delay_ticks"]

        # Network playability related
        self.tick_data_lock = asyncio.Lock()  # Protect shared tick_data
        self.tick_data = deque(maxlen=self.server_max_delay_ticks)
        self.rng = random.Random(self.start_time_ms)

        # Players & related
        self.player_count = player_count
        self.player_goals = [0] * player_count
        self.results = [0] * player_count
        self.last_player_hit = None
        self.paddle_speed_width_percent = GAME_REGISTRY["pong"]["paddle_speed_width_percent"]
        self.paddle_movement_speed = 0.0

        # Game objects -> w/ collisions
        self.balls = []
        self.walls = []
        self.player_paddles = []

    async def update(self):
        """Calulcate the next game state"""
        if self.start_game:
            for ball in self.balls:
                if ball["do_collision"]:
                    self.do_collision_checks(ball)
            self.trigger_modifiers('on_update')

            snapshot = self.get_state_snapshot()
            async with self.tick_data_lock:
                self.last_update_time = int(time.time() * 1000)
                self.tick_data.append(snapshot)

    def simulate_tick(self):
        """Simulate 1 server tick"""
        if self.start_game:
            for ball in self.balls:
                if ball["do_collision"]:
                    self.do_collision_checks(ball)
            self.trigger_modifiers('on_update')

    async def handle_action(self, action):
        """Handle client action"""
        # print(f"Received action: {action}")

        # Handle paddle movement action
        # Handle use_modifier action
        #    -> handle ping compensation

        delay_ms = self.last_update_time - action['timestamp']
        delay_ticks = round(delay_ms / self.server_tickrate_ms)

        # print(f"Timestamps:")
        # print(f"  |- last update: {self.last_update_time}")
        # print(f"  |- user input : {action['timestamp']}")
        # print(f"  |--> delay ms    : {delay_ms}")
        # print(f"  |--> delay ticks : {delay_ticks}")
        # print()

        if delay_ticks > self.server_max_delay_ticks:
            print(f"Player {action['player_id']} has really high ping -> disconnecting")
            # TODO: Disconnection in case of high ping
            pass

        # Rewind game state delay_ticks
        if delay_ticks > 0:
            print(f"Rewinding {delay_ticks} ticks")
            self.rewind(delay_ticks)

        # Apply user_input
        match(action["action"]):
            case 'UP':
                self.move_paddle(action['player_id'], 1)

            case 'DOWN':
                self.move_paddle(action['player_id'], -1)

        # Fast-forward to go bak to the current tick
        if delay_ticks > 0:
            print(f"Fast-forwarding {delay_ticks} ticks")
            await self.fast_forward(delay_ticks)

    def get_state_snapshot(self):
        """Returns the current game state"""
        game_state = super().get_state_snapshot()

        game_state["balls"] = self.balls
        game_state["player_paddles"] = self.player_paddles
        game_state["walls"] = self.walls
        game_state["rng"] = self.rng.getstate()
        return game_state

    def load_state_snapshot(self, snapshot):
        """Load game objects from a snapshot"""

        self.balls = snapshot['balls']
        self.walls = snapshot['walls']
        self.player_paddles = snapshot['player_paddles']

        self.rng.setstate(snapshot['rng'])

    def rewind(self, to_tick):
        """Rewinds the game state to a specific tick"""

        if to_tick > len(self.tick_data):
            print(f"Can't rewind that far -> rewinding as much as possible")
            to_tick = len(self.tick_data)

        self.load_state_snapshot(self.tick_data[-to_tick])

    async def fast_forward(self, tick_count):
        """Plays tick_count updates in a row"""
        # Remove the outdated ticks from the end.
        async with self.tick_data_lock:
            for _ in range(tick_count):
                if self.tick_data:  # safety check in case deque is empty
                    self.tick_data.pop()

        # Now, re-simulate the ticks one by one.
        for _ in range(tick_count):
            self.simulate_tick()
            snapshot = self.get_state_snapshot()
            async with self.tick_data_lock:
                self.tick_data.append(snapshot)

    def move_paddle(self, player_id, direction):
        """Moves player_id's paddle in direction"""

        if not player_id in range(self.player_count):
            print(f"Trying to move {player_id}'s paddle when there's {self.player_count} players")
            return

        if not self.player_paddles[player_id]["do_move"]:
            print(f"Player {player_id}'s paddle can't be moved")
            return

        if  (direction > 0 and self.player_paddles[player_id]["displacement"]) > (50 - self.player_paddles[player_id]["coverage"] / 2.0) or \
            (direction < 0 and self.player_paddles[player_id]["displacement"]) < -(50 - self.player_paddles[player_id]["coverage"] / 2.0):
            print(f"Can't move in this direction anymore")
            return

        self.player_paddles[player_id]["x"] += direction * self.player_paddles[player_id]["speed"] * self.player_paddles[player_id]["dx"]
        self.player_paddles[player_id]["y"] += direction * self.player_paddles[player_id]["speed"] * self.player_paddles[player_id]["dy"]
        self.player_paddles[player_id]["displacement"] += direction * self.paddle_speed_width_percent

        self.trigger_modifiers('on_player_movement', player_id=player_id)

    def reset_ball(self, ball_id=-1):
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

            power_up_collision = None if not self.power_up_manager.spawned_power_ups else PhysicsEngine.detect_collision(ball, remaining_distance, self.power_up_manager.spawned_power_ups, "power_up")
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
                    self.trigger_modifiers("on_power_up_pickup", power_up=self.power_up_manager.spawned_power_ups[collision["object_id"]], player_id=self.last_player_hit)
                    self.power_up_manager.spawned_power_ups.remove(self.power_up_manager.spawned_power_ups[collision["object_id"]])

                remaining_distance -= travel_distance
            else:
                # Move ball normally if no collision
                ball["x"] += round(ball["dx"] * remaining_distance, ndigits=2)
                ball["y"] += round(ball["dy"] * remaining_distance, ndigits=2)
                break

            loop_counter += 1
            if loop_counter > (ball["speed"] * 3.0) + 1:
                break
