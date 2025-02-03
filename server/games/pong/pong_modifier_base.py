

class PongModifierBase:
    def __init__(self):
        self.spawn_weight = 0       # used for spwan chance calculations
        self.player_id = -1         # -1 Until added to a player inventory
        pass                        #   for general game modifiers, keep -1

    def activate(self, game, player_id=-1):
        """Activates the modifier"""
        self.player_id = player_id
        self.on_activation(game)

    def on_update(self, game, player_id=-1):
        """Called every game tick."""
        pass

    def on_paddle_bounce(self, game, player_id=-1):
        """Called when the ball bounces off a paddle."""
        pass

    def on_wall_bounce(self, game, player_id=-1):
        """Called when the ball bounces off a wall."""
        pass

    def on_goal(self, game, player_id=-1):
        """Called when a goal is scored."""
        pass

    def on_modifier_pickup(self, game, player_id=-1):
        """Triggers when player pickup a modifier"""
        pass

    def on_modifier_pickup_overflow(self, game, player_id=-1):
        """Triggers when player pickup a modifier, on a full modifier inventory"""
        pass

    def on_activation(self, game, player_id=-1):
        """Called when the modifier is activated"""
        pass
