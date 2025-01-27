

class PongModifierBase:
    def __init__(self):
        self.spawn_weight = 0       # used for spwan chance calculations
        self.player_id = -1         # -1 Until added to a player inventory
        pass                        #   for general game modifiers, keep -1

    def activate(self, game, player_id=-1):
        """Activates the modifier"""
        self.player_id = player_id
        self.on_activation(game)

    def on_update(self, game):
        """Called every game tick."""
        pass

    def on_bounce(self, game):
        """Called when the ball bounces off a paddle."""
        pass

    def on_goal(self, game):
        """Called when a goal is scored."""
        pass

    def on_modifier_pickup(self, game):
        """Triggers when player pickup a modifier"""
        pass

    def on_modifier_pickup(self, game):
        """Triggers when player pickup a modifier"""
        pass

    def on_activation(self, game):
        """Called when the modifier is activated"""
        pass
