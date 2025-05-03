import type { GameBase } from "../gameBase";
import { GameStatus } from "../../../types/games/gameBaseState";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import { PongMinimalGameState } from "../../../types/games/pong/gameState";

const gameLoop = async (gameManagerId: string) => {
  const gameManager = gameManagers.get(gameManagerId);

  if (gameManager === undefined) throw new Error("Game does not exist");
  const game: GameBase = gameManager.getGame();

  let loopCounter = 0;
  const sleepIntervalMs: number = 1000.0 / game.getServerTickrateS();

  const playerIdReferenceTable = gameManager.getReferenceTable();
  while (game.getStatus() === GameStatus.RUNNING) {
    game.update();

    const gameStateMessage = game.getStateSnapshot() as PongMinimalGameState;
    gameManager.sendMessageToAll(
      "gameState",
      gameStateMessage,
      playerIdReferenceTable,
    );

    await sleep(sleepIntervalMs);
    loopCounter++;
  }
  return;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default gameLoop;
