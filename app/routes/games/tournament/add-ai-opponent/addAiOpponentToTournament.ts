import type { FastifyPluginAsync } from "fastify";
import addAIOpponentHandler from "../../../../services/games/tournament/addAiOpponent/addAiOpponentHandler";
import addAiToTournamentSchema from "../../../../schemas/games/lobby/joinLobbySchema";

const addAIOpponentToTournament: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: addAIOpponentHandler,
    schema: addAiToTournamentSchema,
  });
};

export default addAIOpponentToTournament;
