from ..modifier_base import ModifierBase


class PongModifierBase(ModifierBase):

    def __init__(self):
        super().__init__()

    def on_paddle_bounce(self, game, player_id=-1):
        """Called when the ball bounces off a paddle."""
        pass

    def on_wall_bounce(self, game, player_id=-1):
        """Called when the ball bounces off a wall."""
        pass

    def on_goal(self, game, player_id=-1):
        """Called when a goal is scored."""
        pass

    def on_player_elimination(self, game, player_id):
        """Called when a player is eliminated"""
        pass
