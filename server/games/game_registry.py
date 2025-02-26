import os
import importlib
import json

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
            game_mode: {
                "class": import_class(f"games.{game}.game_modes.{game_mode}", mod_data["class_name"]),
                **mod_data
            }
            for game_mode, mod_data in data["game_modes"].items()
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

# Load registry at startup
load_game_registry()
print(f"Loaded games' registry from JSON: {GAME_REGISTRY}")