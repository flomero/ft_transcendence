from collections import deque
from .game_base import BaseGame


class Player():
    def __init__(self, ingame_id, modifier_inventory_size=2):
        self.ingame_id = ingame_id
        self.modifier_inventory = []
        self.modifier_inventory_size = modifier_inventory_size

    def add_modifier(self, game: BaseGame, modifier, on_modifier_pickup_overflow: function):
        """Adds modifier to the player's inventory"""
        if len(self.modifier_inventory) >= self.modifier_inventory_size:
            game.trigger_modifiers(method=on_modifier_pickup_overflow)
            return

        self.modifier_inventory.append(modifier)

    def use_modifier(self, game):
        if len(self.modifier_inventory) <= 0:
            return

        modifier = self.modifier_inventory.pop(0)
        return modifier