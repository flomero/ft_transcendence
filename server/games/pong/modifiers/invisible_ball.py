import random

class InvisibleBall:
    """Makes the ball disappear randomly."""

    name = "InvisibleBall"

    def apply(self, game):
        pass

    def update(self, game):
        """Randomly make ball invisible."""
        game.ball["visible"] = random.random() > 0.2  # 80% visibility chance
