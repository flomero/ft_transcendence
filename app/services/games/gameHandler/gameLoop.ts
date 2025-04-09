import { type GameBase, GameStatus } from "../gameBase";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import saveGameResultInDb from "./saveGameResultInDb";
import { Database } from "sqlite";

const gameLoop = async (gameManagerId: string, db: Database) => {
  const gameManager = gameManagers.get(gameManagerId);

  if (gameManager === undefined) throw new Error("Game does not exist");
  const game: GameBase = gameManager.getGame;

  let loopCounter: number = 0;
  const sleepIntervalMs: number = 1000.0 / game.getServerTickrateS();

  while (game.getStatus() === GameStatus.RUNNING) {
    game.update();

    const gameStateMessage = JSON.stringify(game.getStateSnapshot());
    gameManager.sendMessageToAll("gameState", gameStateMessage);

    await sleep(sleepIntervalMs);
    loopCounter++;
  }
  saveGameResultInDb(gameManagerId, db);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default gameLoop;
