import time
from collections import deque
from .power_up_manager import PowerUpManager


class GameBase():
    MAX_TICKS = 100     # If a client is more than MAX_TICKS ticks behind the server -> disconnect

    def __init__(self, game_name, game_mode, modifiers=[], power_ups=[]):
        self.last_update_time = time.time()
        self.current_time = time.time()
        self.modifiers = modifiers
        self.running = False
        self.tick_data = deque(maxlen=self.MAX_TICKS)
        self.power_up_manager = PowerUpManager(power_ups, game_name, game_mode)

    def update(self):
        """Advances the game by 1 tick"""
        pass

    def start_game(self):
        """Starts the game"""
        self.running = True
        print(f"Game started")
        self.trigger_modifiers('on_game_start')

    def rewind(self, to_tick):
        """Rewind the game state to a specific time"""
        if len(self.tick_data) < to_tick:
            print(f"Trying to rewind too much: {to_tick} / {self.MAX_TICKS}")
            return

        self.load_state_snapshot(self.tick_data[-to_tick])

    def fast_forward(self, tick_count):
        """Replays the game until current state"""
        for _ in range(tick_count):
            self.update()

    def get_state_snapshot(self):
        """Returns a snapshot of the current game state."""
        return {
            "timestamp": time.time()
        }

    def load_state_snapshot(self, snapshot):
        """Restores a game state snapshot."""
        pass

    def handle_action(self, action):
        """Handle client action"""
        pass

    def spawn_power_up(self, position: tuple):
        """Spawns a power_up at the designated position"""
        self.power_up_manager.spawn_power_up(position)
        self.trigger_modifiers("on_power_up_spawn", power_up=self.power_up_manager.spawned_power_ups[-1])

    def trigger_modifiers(self, method, *args, **kwargs):
        """Triggers method on modifiers if applicable, forwarding extra arguments."""

        for modifier in self.modifiers:
            try:
                getattr(modifier, method)(self, *args, **kwargs)
            except AttributeError:
                print(f"Unknown method: {method}, for modifier: {modifier}")
                print(f"Available methods:\n  |- {dir(modifier)}")
        for power_up in self.power_up_manager.active_power_ups:
            try:
                getattr(power_up, method)(self, *args, **kwargs)
            except AttributeError:
                print(f"Unknown method: {method}, for power_up: {power_up}")
                print(f"Available methods:\n  |- {dir(power_up)}")

