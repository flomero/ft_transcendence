import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import type { GameBase } from "../gameBase";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import { PongAIOpponent } from "./pongAIOpponent";
import { GameStatus } from "../../../types/games/gameBaseState";
import { fastifyInstance } from "../../../app";

export const pongConsumer = async (
  ws: WebSocket,
  req: FastifyRequest,
): Promise<void> => {
  let currentGame: GameBase | null = null;
  let gameLoopInterval: NodeJS.Timeout | null = null;

  let aiOpponent: PongAIOpponent | null = null;
  let aiOpponent2: PongAIOpponent | null = null;
  let aiLoopInterval: NodeJS.Timeout | null = null;

  // Helper function to sleep
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Function to start the game loop
  const startGameLoop = async (game: GameBase) => {
    if (gameLoopInterval) {
      clearInterval(gameLoopInterval);
    }

    let loopCounter: number = 0;
    const sleepIntervalMs: number = 1000.0 / game.getServerTickrateS();
    // Game loop
    while (game.getStatus() === GameStatus.RUNNING) {
      // Update game state
      game.update();

      // Send the updated state to clients
      const gameState = game.getStateSnapshot();
      ws.send(
        JSON.stringify({
          type: "gameState",
          data: gameState,
        }),
      );

      // Wait for the next tick
      await sleep(sleepIntervalMs);
      loopCounter++;

      // if (loopCounter % 300 === 0)
      //   currentGame?.eliminate(loopCounter / 300 - 1);
    }
  };

  const startAILoop = async (game: GameBase, ais: PongAIOpponent[]) => {
    if (aiLoopInterval) clearInterval(aiLoopInterval);

    const sleepIntervalMs: number = 1000.0;
    while (game.getStatus() === GameStatus.RUNNING) {
      ais.forEach((ai) => ai.update());
      await sleep(sleepIntervalMs);
    }
  };

  // Handle incoming messages
  ws.on("message", async (message) => {
    try {
      const rawData: Record<string, any> = JSON.parse(message.toString());

      fastifyInstance.log.debug("Raw data received:");
      fastifyInstance.log.debug(rawData);

      const messageType = rawData.type;
      const data = rawData.options;

      switch (messageType) {
        case "createGame": {
          // Get the concrete game class from registrys
          const GameClass =
            GAME_REGISTRY[data.gameName].gameModes[data.gameModeName].class;

          // Create a new game instance using the concrete class
          currentGame = new GameClass(data || {});

          aiOpponent = new PongAIOpponent(currentGame, {
            playerId: 0,
            strategyName: "foresight",
          });

          aiOpponent2 = new PongAIOpponent(currentGame, {
            playerId: 1,
            strategyName: "foresight",
          });

          // Send confirmation back to client
          ws.send(
            JSON.stringify({
              type: "gameCreated",
            }),
          );
          break;
        }

        case "gameStart": {
          if (!currentGame) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "No active game found",
              }),
            );
            return;
          }

          currentGame.startGame();

          // If game is now running, start the game loop
          if (currentGame.getStatus() === GameStatus.RUNNING) {
            startGameLoop(currentGame);

            if (aiOpponent && aiOpponent2)
              startAILoop(currentGame, [aiOpponent, aiOpponent2]);
          }

          break;
        }

        case "userInput": {
          if (!currentGame) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "No active game found",
              }),
            );
            return;
          }

          // Pass the action to the game
          currentGame.handleAction(data);
          break;
        }

        default:
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Unknown message type: ${messageType}`,
            }),
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        }),
      );
    }
  });

  // Handle disconnection
  // ws.on("close", () => {
  //     if (currentGame) {
  //         // Clean up game resources if needed
  //         currentGame.cleanup?.();
  //         currentGame = null;
  //     }

  //     if (gameLoopInterval) {
  //         clearInterval(gameLoopInterval);
  //     }
  // });
};
