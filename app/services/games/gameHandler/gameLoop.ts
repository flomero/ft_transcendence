import { type GameBase, GameStatus } from "../gameBase";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import saveGameResultInDb from "./saveGameResultInDb";
import { Database } from "sqlite";
import createPlayerIdReferenceTable from "./createPlayerIdReferenceTable";

const gameLoop = async (gameManagerId: string, db: Database) => {
  const gameManager = gameManagers.get(gameManagerId);

  if (gameManager === undefined) throw new Error("Game does not exist");
  const game: GameBase = gameManager.getGame;

  let loopCounter: number = 0;
  const sleepIntervalMs: number = 1000.0 / game.getServerTickrateS();
  const playerIdReferenceTable = createPlayerIdReferenceTable(gameManager);

  while (game.getStatus() === GameStatus.RUNNING) {
    game.update();

    const gameStateMessage = JSON.stringify(game.getStateSnapshot());
    gameManager.sendMessageToAll(
      "gameState",
      gameStateMessage,
      playerIdReferenceTable,
    );

    await sleep(sleepIntervalMs);
    loopCounter++;
  }
  await saveGameResultInDb(gameManagerId, db);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default gameLoop;
