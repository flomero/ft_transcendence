from games.base_game import BaseGame

class BasePong(BaseGame):
    """Base class for all Pong variants."""

    def __init__(self, modifiers=None):
        super().__init__(modifiers)
        self.initial_speed = 2
        self.ball = {"x": 50, "y": 50, "vx": self.initial_speed, "vy": 1, "size": 5}
        self.paddles = {}

    def reset_ball(self):
        """Reset ball position and speed."""
        self.ball = {"x": 50, "y": 50, "vx": self.initial_speed, "vy": 1, "size": 5}

    def update(self):
        """Update ball movement and check for collisions."""
        self.ball["x"] += self.ball["vx"]
        self.ball["y"] += self.ball["vy"]

        # Ball collision with top/bottom
        if self.ball["y"] <= 0 or self.ball["y"] >= 100 - self.ball["size"]:
            self.ball["vy"] *= -1

        for modifier in self.modifiers:
            modifier.update(self)

    def get_state(self):
        return {
            "ball": self.ball,
            "paddles": self.paddles,
            "modifiers": [mod.name for mod in self.modifiers],
        }
