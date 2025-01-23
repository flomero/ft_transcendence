from games.pong.base_pong import BasePong

class SoloPong(BasePong):
    """Pong with a single paddle and a right-side wall."""

    name = "SoloPong"

    def __init__(self, modifiers=None):
        super().__init__(modifiers)
        self.paddles = {
            "player": {"x": 5, "y": 50, "width": 2, "height": 20},
        }

    def update(self):
        super().update()

        # Ball collision with paddle
        if self.ball["x"] <= self.paddles["player"]["x"] + self.paddles["player"]["width"]:
            if self.paddles["player"]["y"] <= self.ball["y"] <= self.paddles["player"]["y"] + self.paddles["player"]["height"]:
                self.ball["vx"] *= -1
            else:
                self.reset_ball()

        # Ball bounces on right wall
        if self.ball["x"] >= 100 - self.ball["size"]:
            self.ball["vx"] *= -1
