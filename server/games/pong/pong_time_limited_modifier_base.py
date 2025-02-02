from .pong_modifier_base import PongModifierBase


class PongTimeLimitedModifierBase(PongModifierBase):
    def __init__(self):
        super().__init__()

        self.duration = 0           # in server ticks (30 ms / tick)
        self.active = False
        self.ticks = 0              # ticks count since activation

    def on_update(self, game):
        if not self.active:
            return

        self.ticks -= 1
        if self.ticks <= 0:
            self.deactivate()

    def deactivate(self, game):
        """Deactivate the modifier"""
        self.active = False
        self.ticks = self.duration
        self.on_deactivation(game)

    def on_activation(self, game):
        """Called when the modifier is activated"""
        self.ticks = self.duration
        self.active = True

    def on_deactivation(self, game):
        """Called when the modifier is deactivated"""
        pass
