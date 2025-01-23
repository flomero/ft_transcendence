import os
import json
import importlib

GAME_REGISTRY = {}

# Load JSON Game Registry
def load_game_registry():
    global GAME_REGISTRY
    json_path = os.path.join(os.path.dirname(__file__), "game_registry.json")

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Game registry JSON not found at {json_path}")

    with open(json_path, "r") as f:
        GAME_REGISTRY = json.load(f)

    # Import all games, variants, and modifiers dynamically
    for game, data in GAME_REGISTRY.items():

        GAME_REGISTRY[game]["variants"] = {
            variant: import_class(f"games.{game}.game_modes.{variant}", class_name)
            for variant, class_name in data["variants"].items()
        }

        GAME_REGISTRY[game]["modifiers"] = {
            mod: import_class(f"games.{game}.modifiers.{mod}", class_name)
            for mod, class_name in data["modifiers"].items()
        }

# Import Class Helper
def import_class(module_path, class_name):
    """Dynamically import a class given its module path and class name."""
    module = importlib.import_module(module_path)
    if not hasattr(module, class_name):
        raise AttributeError(f"Module '{module_path}' does not have class '{class_name}'")
    return getattr(module, class_name)

# Base Class for All Games
class BaseGame:
    def __init__(self, modifiers=None):
        self.modifiers = modifiers if modifiers else []
        for modifier in self.modifiers:
            modifier.apply(self)

    def update(self):
        """Update game logic and apply modifiers."""
        for modifier in self.modifiers:
            modifier.update(self)

    def get_state(self):
        """Return the game state."""
        return {"modifiers": [mod.name for mod in self.modifiers]}

# Load registry at startup
load_game_registry()
print(f"Loaded games' registry from JSON: {GAME_REGISTRY}")
