from ..game_base import GameBase
from .tic_tac_toe_board import TicTacToeBoard


class EnhancedTicTacToe(GameBase):
    name = "enhanced_tic_tac_toe"

    def __init__(self, modifiers, power_ups, **kwargs):
        super().__init__(game_name=self.name, game_mode="classic", modifiers=modifiers, power_ups=power_ups)

        # Server related
        self.updated = True

        # Boards
        self.inner_boards = [[TicTacToeBoard() for _ in range(3)] for _ in range(3)]
        self.outer_grid = [[None for _ in range(3)] for _ in range(3)]

        # Game Logic
        self.next_action = "grid_selection"
        self.selected_grid = None
        self.current_player = "X"

        # Extras
        self.winner = None
        self.completed = False

    def get_state_snapshot(self):
        snapshot = {
            "outer_grid": self.outer_grid,
            "inner_boards": [[board.get_state() for board in row] for row in self.inner_boards],
            "next_action": self.next_action,
            "selected_grid": self.selected_grid,
            "current_player": self.current_player,
            "game_status": {
                "completed": self.completed,
                "winner": self.winner
            }
        }

        snapshot["updated"] = self.updated
        self.updated = False

        snapshot.update(super().get_state_snapshot())
        return snapshot

    async def handle_action(self, action):
        """
        Expects two types:
          - {"type": "user_input", "sub_type": "user_grid_selection", "grid": {"row": X, "col": Y}}
          - {"type": "user_input", "sub_type": "user_cell_selection", "cell": {"row": X, "col": Y}}
        """

        print(f"Received user_input: {action}")

        if action["sub_type"] == "user_grid_selection":
            # Only allowed if next_action is GRID_SELECTION
            if self.next_action != "grid_selection":
                print(f"Trying to do grid_selection when expecting next action to be {self.next_action}")
                return

            grid = action["grid"]
            row, col = grid["row"], grid["col"]
            if  not row in range(3) or \
                not col in range(3):
                print(f"row or col out of range: {(grid['row'], grid['col'])}")
                return


            if self.inner_boards[row][col].completed:
                print(f"Invalid cell: {(row, col)}")
                return

            self.selected_grid = (row, col)
            self.next_action = "cell_selection"

            self.updated = True
        elif action["sub_type"] == "user_cell_selection":
            # Only allowed if next_action is GRID_SELECTION
            if self.next_action != "cell_selection":
                print(f"Trying to do cell_selection when expecting next action to be {self.next_action}")
                return

            if not self.selected_grid:
                print(f"No selected grid: can't play")
                return

            grid = action["grid"]
            cell = action["cell"]
            (g_row, g_col) = self.selected_grid
            c_row, c_col = cell["row"], cell["col"]

            board = self.inner_boards[g_row][g_col]
            try:
                board.make_move(c_row, c_col, self.current_player)
            except ValueError:
                print(f"An error occured while making the move")
                return  # cell occupied, invalid move

            # If the inner board is won, update the outer grid.
            if board.completed:
                self.outer_grid[g_row][g_col] = board.winner

            # Determine the selected grid for the next move.
            self.selected_grid = (c_row, c_col)
            # If that grid is already complete, allow free selection.
            selected_grid = self.inner_boards[c_row][c_col]
            if selected_grid.completed:
                self.selected_grid = None
                self.next_action = "grid_selection"
            else:
                self.next_action = "cell_selection"

            # Next player
            self.current_player = "O" if self.current_player == "X" else "X"

            # Optionally check if the outer board has a winner (three in a row).
            self._check_winner()

            self.updated = True
        else:
            print(f"Unknown action type received: {action['type']}")

    def _check_winner(self):
        lines = self.outer_grid + list(zip(*self.outer_grid))  # rows and columns
        diagonals = [
            [self.outer_grid[i][i] for i in range(3)],
            [self.outer_grid[i][2-i] for i in range(3)]
        ]

        for line in lines + diagonals:

            if line[0] and all(cell == line[0] for cell in line):
                self.winner = line[0]
                self.completed = True
                return

        if all(cell is not None for row in self.outer_grid for cell in row):
            self.completed = True
