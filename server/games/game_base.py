import os
import json
import importlib
import time
from collections import deque

GAME_REGISTRY = {}

# Load JSON Game Registry
def load_game_registry():
    global GAME_REGISTRY
    json_path = os.path.join(os.path.dirname(__file__), "game_registry.json")

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Game registry JSON not found at {json_path}")

    with open(json_path, "r") as f:
        GAME_REGISTRY = json.load(f)

    # Import all games, game_modes, and modifiers dynamically
    for game, data in GAME_REGISTRY.items():
        # Load game modes
        GAME_REGISTRY[game]["game_modes"] = {
            game_mode: import_class(f"games.{game}.game_modes.{game_mode}", class_name)
            for game_mode, class_name in data["game_modes"].items()
        }

        # Load game_modifiers with additional metadata
        GAME_REGISTRY[game]["game_modifiers"] = {
            mod: {
                "class": import_class(f"games.{game}.game_modifiers.{mod}", mod_data["class_name"]),
                **mod_data  # additional properties like duration
            }
            for mod, mod_data in data["game_modifiers"].items()
        }

        # Load power_ups with additional metadata
        GAME_REGISTRY[game]["power_ups"] = {
            mod: {
                "class": import_class(f"games.{game}.power_ups.{mod}", mod_data["class_name"]),
                **mod_data  # additional properties like duration
            }
            for mod, mod_data in data["power_ups"].items()
        }

# Import Class Helper
def import_class(module_path, class_name):
    """Dynamically import a class given its module path and class name."""
    module = importlib.import_module(module_path)
    if not hasattr(module, class_name):
        raise AttributeError(f"Module '{module_path}' does not have class '{class_name}'")
    return getattr(module, class_name)

class GameBase():
    MAX_TICKS = 100     # If a client is more than MAX_TICKS ticks behind the server -> disconnect

    def __init__(self, modifiers=None):
        self.last_update_time = time.time()
        self.current_time = time.time()
        self.modifiers = modifiers
        self.running = False
        self.tick_data = deque(maxlen=self.MAX_TICKS)

    def update(self):
        """Advances the game by 1 tick"""
        pass

    def start_game(self):
        """Starts the game"""
        self.running = True
        print(f"Game started")

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

    def trigger_modifiers(self, method, *args, **kwargs):
        """Triggers method on modifiers if applicable, forwarding extra arguments."""
        for modifier in self.modifiers:
            try:
                getattr(modifier, method)(self, *args, **kwargs)
            except AttributeError:
                print(f"Unknown method: {method}, for modifier: {modifier}")

# Load registry at startup
load_game_registry()
print(f"Loaded games' registry from JSON: {GAME_REGISTRY}")
