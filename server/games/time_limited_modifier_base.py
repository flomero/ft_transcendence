from .modifier_base import ModifierBase


class TimeLimitedModifierBase(ModifierBase):
    def __init__(self):
        super().__init__()

        self.duration = 0           # in server ticks (30 ms / tick)
        self.ticks = 0              # ticks count since activation

    def on_update(self, game):
        if not self.active:
            return

        self.ticks -= 1
        if self.ticks <= 0:
            self.deactivate(game)

    def on_activation(self, game):
        """Called when the modifier is activated"""
        self.ticks = self.duration
