import { type GameBase, GameStatus } from "../gameBase";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import type GameManager from "./GameManager";

const aiLoop = async (gameManagerId: string) => {
  // needs to save the Ai in db Later
  const gameManager = gameManagers.get(gameManagerId);

  if (gameManager === undefined) throw new Error("Game does not exist");
  if (gameManager?.getAiIdsAsArray.length === 0) return;
  const game: GameBase = gameManager.getGame;

  const sleepIntervalMs: number = 1000.0 / game.getServerTickrateS();
  while (game.getStatus() === GameStatus.RUNNING) {
    updateAllAis(gameManager);
    await sleep(sleepIntervalMs);
  }
};

const updateAllAis = (gameManager: GameManager) => {
  for (const aiOpponent of gameManager.aiOpponent.values()) {
    aiOpponent.update();
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default aiLoop;
