from ..enhanced_tic_tac_toe import EnhancedTicTacToe


class EnhancedTicTacToeClassic(EnhancedTicTacToe):
    name = "enhanced_tic_tac_toe_classic"

    def __init__(self, modifiers, power_ups):
        super().__init__(game_name=self.name, game_mode="classic", modifiers=modifiers, power_ups=power_ups)