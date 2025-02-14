from .pong_modifier_base import PongModifierBase


class PongTimeLimitedModifierBase(PongModifierBase):
    def __init__(self):
        super().__init__()

        self.duration = 0           # in server ticks (30 ms / tick)
        self.active = False
        self.ticks = 0              # ticks count since activation

    def activate(self, game, player_id=-1):
        self.active = True
        self.ticks = self.duration
        self.on_activation(game)

    def on_update(self, game):
        if not self.active:
            return

        self.ticks -= 1
        if self.ticks <= 0:
            self.deactivate(game)

    def deactivate(self, game):
        """Deactivate the modifier"""
        self.active = False
        self.ticks = self.duration
        self.on_deactivation(game)

    def on_activation(self, game):
        """Called when the modifier is activated"""
        pass

    def on_deactivation(self, game):
        """Called when the modifier is deactivated"""
        pass
