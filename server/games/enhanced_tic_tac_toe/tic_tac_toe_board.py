

class TicTacToeBoard:
    """Inner 3x3 tic-tac-toe Board"""

    def __init__(self):

        # 2D array initialized to None
        self.board = [[None for _ in range(3)] for _ in range(3)]

        self.winner = None
        self.completed = False

    def make_move(self, row, col, player):
        if self.completed:
            raise ValueError("Board already completed")

        if self.board[row][col] is not None:
            raise ValueError("Cell already occupied")

        self.board[row][col] = player
        self._check_winner()

    def is_valid(self, row, col):
        return (not self.completed and \
                not self.board[row][col] == None)

    def _check_winner(self):
        lines = self.board + list(zip(*self.board))  # rows and columns
        diagonals = [
            [self.board[i][i] for i in range(3)],
            [self.board[i][2-i] for i in range(3)]
        ]

        for line in lines + diagonals:
            if line[0] and all(cell == line[0] for cell in line):
                self.winner = line[0]
                self.completed = True
                return

        if all(cell is not None for row in self.board for cell in row):
            self.completed = True

    def get_state(self):
        return {
            "board": self.board,
            "winner": self.winner,
            "completed": self.completed
        }
