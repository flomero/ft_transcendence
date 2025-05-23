import type { GameBase } from "../gameBase";
import { GameStatus } from "../../../types/games/gameBaseState";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import { PongMinimalGameState } from "../../../types/games/pong/gameState";
import GameManager from "./GameManager";
import { FastifyInstance } from "fastify";
import { getUserWithImage } from "../../../services/database/user";

const gameLoop = async (gameManagerId: string, fastify: FastifyInstance) => {
  const gameManager = gameManagers.get(gameManagerId);

  if (gameManager === undefined) throw new Error("Game does not exist");
  const game: GameBase = gameManager.getGame();

  let loopCounter = 0;
  const sleepIntervalMs: number = 1000.0 / game.getServerTickrateS();

  const playerIdReferenceTable = gameManager.getReferenceTable();
  while (game.getStatus() === GameStatus.RUNNING) {
    game.update();
    sendGameState(gameManager, game, playerIdReferenceTable);
    await sleep(sleepIntervalMs);
    loopCounter++;
  }
  sendGameState(gameManager, game, playerIdReferenceTable);
  await sendGameWinner(gameManager, playerIdReferenceTable, fastify);
  return;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sendGameState = (
  gameManager: GameManager,
  game: GameBase,
  playerIdReferenceTable: string[],
) => {
  const gameStateMessage = game.getStateSnapshot() as PongMinimalGameState;
  gameManager.sendMessageToAll({
    type: "gameState",
    data: gameStateMessage,
    referenceTable: playerIdReferenceTable,
  });
};

const sendGameWinner = async (
  gameManager: GameManager,
  playerIdReferenceTable: string[],
  fastify: FastifyInstance,
) => {
  const winnerId = getGameWinner(gameManager.game, playerIdReferenceTable);
  if (winnerId === null) return;

  const userWithImage = await getUserWithImage(fastify, winnerId);
  if (!userWithImage) return;

  const html = await fastify.view("components/game/winner", {
    user: userWithImage,
    isTournament: gameManager.gameOrigin?.type === "tournament",
    tournamentId:
      gameManager.gameOrigin?.type === "tournament"
        ? gameManager.gameOrigin?.tournament.tournamentId
        : "",
  });
  gameManager.sendMessageToAll({ type: "gameFinished", data: html });
  if (gameManager.gameOrigin?.type === "tournament") {
    gameManager.sendMessageToAll({
      type: "redirect",
      data: `/games/tournament/join/${gameManager.gameOrigin.tournament.tournamentId}`,
    });
  }
};

const getGameWinner = (game: GameBase, playerIdReferenceTable: string[]) => {
  if (game.getStatus() !== GameStatus.FINISHED) return null;

  const gameResult = game.getResults();
  const smallestResult = Math.min(...gameResult);
  const indexOfGameResult = gameResult.indexOf(smallestResult);
  const indexOfGameWinner = playerIdReferenceTable[indexOfGameResult];
  return indexOfGameWinner;
};

export default gameLoop;
