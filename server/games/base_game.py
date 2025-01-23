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
        base_class = f"games.game_logic.{game}.{data['base_class']}"
        GAME_REGISTRY[game]["base_class"] = import_class(base_class)

        GAME_REGISTRY[game]["variants"] = {
            variant: import_class(f"games.game_logic.{game}.{variant}")
            for variant in data["variants"]
        }

        GAME_REGISTRY[game]["modifiers"] = {
            mod: import_class(f"games.game_logic.modifiers.{mod}")
            for mod in data["modifiers"]
        }

# Import Class Helper
def import_class(full_class_path):
    """Dynamically import a class given its full path."""
    module_name, class_name = full_class_path.rsplit(".", 1)
    module = importlib.import_module(module_name)
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
