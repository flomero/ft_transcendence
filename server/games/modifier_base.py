

class ModifierBase:
    name = ""

    def __init__(self):
        self.spawn_weight = 0       # used for spwan chance calculations
        self.player_id = -1         # -1 Until added to a player inventory
        self.active = False
        pass                        #   for general game modifiers, keep -1

    def activate(self, game, player_id=-1):
        """Activates the modifier"""
        self.active = True
        self.player_id = player_id
        self.on_activation(game)

    def deactivate(self, game):
        """Deactivate the modifier"""
        self.active = False
        self.on_deactivation(game)

    def on_update(self, game):
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

    def on_power_up_pickup(self, game, power_up, player_id=-1):
        """Triggers when player pickup a power_up"""
        pass

    def on_power_up_pickup_overflow(self, game, power_up, player_id=-1):
        """Triggers when player pickup a power_up, on a full power_up inventory"""
        pass

    def on_activation(self, game, player_id=-1):
        """Called when the modifier is activated"""
        pass

    def on_deactivation(self, game, player_id=-1):
        """Called when the modifier is activated"""
        pass

    def on_game_start(self, game):
        """Called when then game starts"""
        pass

    def on_power_up_spawn(self, game, power_up):
        """Called when a power up is spawned"""
        pass

    def on_player_elimination(self, game, player_id):
        """Called when a player is eliminated"""
        pass

    def on_player_movement(self, game, player_id):
        """Called when a player moves"""
        pass
