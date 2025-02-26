import time
import random


class GameBase():

    def __init__(self, game_name, game_mode, modifiers=[], power_ups=[]):
        self.last_update_time = int(time.time() * 1000)
        self.start_time_ms = int(time.time() * 1000)
        self.modifiers = modifiers
        self.running = False
        self.tick_data = None
        self.power_up_manager = None

    async def update(self):
        """Advances the game by 1 tick"""
        pass

    def start_game(self):
        """Starts the game"""
        self.running = True
        print(f"Game started")
        self.trigger_modifiers('on_game_start')

    async def rewind(self, to_tick):
        """Rewind the game state to a specific time"""
        pass

    async def fast_forward(self, tick_count):
        """Replays the game until current state"""
        pass

    def get_state_snapshot(self):
        """Returns a snapshot of the current game state."""
        return {
            "type": "game_state",
            "timestamp": self.last_update_time
        }

    def load_state_snapshot(self, snapshot):
        """Restores a game state snapshot."""
        pass

    async def handle_action(self, action):
        """Handle client action"""
        pass

    def spawn_power_up(self, position: tuple, rng: random.Random):
        """Spawns a power_up at the designated position"""
        if  self.power_up_manager.spawn_power_up(rng, position):
            self.trigger_modifiers("on_power_up_spawn", power_up=(self.power_up_manager.spawned_power_ups[-1]))

    def trigger_modifiers(self, method, *args, **kwargs):
        """Triggers method on modifiers if applicable, forwarding extra arguments."""

        for modifier in self.modifiers:
            try:
                getattr(modifier, method)(self, *args, **kwargs)
            except AttributeError:
                print(f"Unknown method: {method}, for modifier: {modifier}")
                print(f"Available methods:\n  |- {dir(modifier)}")
        if self.power_up_manager:
            for power_up in self.power_up_manager.active_power_ups:
                try:
                    getattr(power_up, method)(self, *args, **kwargs)
                except AttributeError:
                    print(f"Unknown method: {method}, for power_up: {power_up}")
                    print(f"Available methods:\n  |- {dir(power_up)}")

