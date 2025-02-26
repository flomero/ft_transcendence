

class ModifierBase:
    name = ""
    player_id = -1

    def __init__(self):
        self.spawn_weight = 0       # used for spwan chance calculations
        self.active = False
        self.duration = 0           # in server ticks (30 ms / tick)
        self.ticks = 0              # ticks count since activation
        pass                        #   for general game modifiers, keep -1

    # Methods
    def activate(self, game, player_id=-1):
        """Activates the modifier"""
        self.active = True
        self.player_id = player_id
        self.on_activation(game)

    def deactivate(self, game):
        """Deactivate the modifier"""
        self.active = False
        self.on_deactivation(game)

    # Triggers
    def on_update(self, game):
        if  self.duration <= 0.0 or \
            not self.active:
            return

        self.ticks -= 1
        if self.ticks <= 0:
            self.deactivate(game)

    def on_activation(self, game):
        """Called when the modifier is activated"""
        self.ticks = self.duration

    def on_user_input(self, game, input):
        """Called when a user makes an input"""
        pass

    def on_activation(self, game, player_id=-1):
        """Called when the modifier is activated"""
        if self.duration <= 0.0:
            return

        self.ticks = self.duration

    def on_deactivation(self, game, player_id=-1):
        """Called when the modifier is activated"""
        pass

    def on_game_start(self, game):
        """Called when then game starts"""
        pass

    def on_power_up_spawn(self, game, power_up):
        """Called when a power up is spawned"""
        pass

    def on_power_up_pickup(self, game, power_up, player_id=-1):
        """Triggers when player pickup a power_up"""
        pass

    # TODO: replace with on_user_input
    def on_player_movement(self, game, player_id):
        """Called when a player moves"""
        pass
