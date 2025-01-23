from games.pong.base_pong import BasePong

class DefaultPong(BasePong):
    """Standard Pong with two paddles."""

    name = "DefaultPong"

    def __init__(self, modifiers=None):
        super().__init__(modifiers)
        self.paddles = {
            "left": {"x": 5, "y": 50, "width": 2, "height": 20},
            "right": {"x": 95, "y": 50, "width": 2, "height": 20},
        }

    def update(self):
        super().update()

        # Ball collision with paddles
        if self.ball["x"] <= self.paddles["left"]["x"] + self.paddles["left"]["width"]:
            if self.paddles["left"]["y"] <= self.ball["y"] <= self.paddles["left"]["y"] + self.paddles["left"]["height"]:
                self.ball["vx"] *= -1
            else:
                self.reset_ball()

        if self.ball["x"] >= self.paddles["right"]["x"]:
            if self.paddles["right"]["y"] <= self.ball["y"] <= self.paddles["right"]["y"] + self.paddles["right"]["height"]:
                self.ball["vx"] *= -1
            else:
                self.reset_ball()
