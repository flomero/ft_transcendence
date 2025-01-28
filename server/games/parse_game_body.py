import json
from .game_base import GAME_REGISTRY

def pars_game_body(message: str):
    data = json.loads(message)

    game_name = game_name_get(data)
    mode_name = mode_name_get(data, game_name)
    modifiers = modifiers_dict_get(data, game_name)

    game_body_dict = {
        "game_name": game_name,
        "mode_name": mode_name,
        "modifiers": modifiers
    }
    return game_body_dict

def game_name_get(data: dict):
    game_name = data.get("game", "pong")
    if game_name not in GAME_REGISTRY:
        print(f"Unknown game: {game_name}, defaulting to Pong")
        game_name = "pong"
    return game_name

def mode_name_get(data: dict, game_name: str):
    mode_name = data.get("game_mode", f"multiplayer_{game_name}")
    return mode_name

def modifiers_dict_get(data: dict, game_name: str):
    modifiers = []
    modifier_names = data.get("modifiers", [])
    available_modifiers = GAME_REGISTRY[game_name]["modifiers"]

    for mod in modifier_names:
        if mod in available_modifiers:
            modifiers.append(available_modifiers[mod]())
    return modifiers