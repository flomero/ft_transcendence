import json
from .game_base import GAME_REGISTRY

def pars_game_body(message: string):
    data = json.loads(message)

    print(f"Received: {data}")

    # Game Selection (fallback = pong)
    game_name = data.get("game", "pong")
    if game_name not in GAME_REGISTRY:
        print(f"Unknown game: {game_name}, defaulting to Pong")
        game_name = "pong"

    # Game Mode Selection (fallback multiplayer_<game>)
    mode_name = data.get("game_mode", f"multiplayer_{game_name}")
    game_modes = GAME_REGISTRY[game_name]["game_modes"]
    if mode_name in game_modes:
        self.game_class = game_modes[mode_name]
    else:
        print(f"Unknown mode: {mode_name}, defaulting to {list(game_modes.keys())[0]}")
        self.game_class = list(game_modes.values())[0]  # Default to first variant

    # Modifier Selection (with fallback to [])
    modifier_names = data.get("modifiers", [])
    available_modifiers = GAME_REGISTRY[game_name]["modifiers"]
    self.modifiers = [available_modifiers[mod]() for mod in modifier_names if mod in available_modifiers]
    return {"game_name": game_name}