

class SpeedBoost:
    """Increases ball speed every few updates."""

    name = "SpeedBoost"

    def __init__(self):
        self.tick_count = 0

    def apply(self, game):
        """Apply initial speed settings."""
        pass

    def update(self, game):
        """Increase speed every 100 ticks."""
        self.tick_count += 1
        if self.tick_count % 100 == 0:
            game.ball["vx"] *= 1.1
            game.ball["vy"] *= 1.1
