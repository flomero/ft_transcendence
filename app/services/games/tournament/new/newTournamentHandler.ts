import { FastifyRequest, FastifyReply } from "fastify";
import canTournamentBeCreatedCheck from "./canTournamentBeCreatedCheck";
import TournamentManager from "../TournamentManager";
import { gameModeFromString } from "../../../config/gameModes";
import {
  TOURNAMENT_CONFIGS_REGISTRY,
  TournamentGameModes,
} from "../../../../config";
import { tournamentConfigFromString } from "../../../config/tournamentConfig";

// Store active tournaments
export const tournaments = new Map<string, TournamentManager>();

async function newTournamentHandler(
  request: FastifyRequest<{
    Params: {
      gameMode: string;
      tournamentMode: string;
      tournamentSize: string;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    const tournamentSize = Number(request.params.tournamentSize);

    canTournamentBeCreatedCheck(userId);
    const gameMode = gameModeFromString(
      request.params.gameMode,
      TournamentGameModes,
    );
    const tournamentConfigKey = tournamentConfigFromString(
      request.params.tournamentMode,
    );

    if (gameMode === null || tournamentConfigKey === null)
      return reply.notFound("Game mode or tournament config not found");

    if (
      TOURNAMENT_CONFIGS_REGISTRY[
        tournamentConfigKey
      ].possiblePlayerCount.includes(tournamentSize) === false
    )
      return reply.badRequest("Tournament size invalid");

    const newTournament = new TournamentManager(
      tournamentConfigKey,
      userId,
      gameMode,
      tournamentSize,
    );
    tournaments.set(newTournament.tournamentId, newTournament);

    return reply.code(201).send({ tournamentId: newTournament.tournamentId });
  } catch (error) {
    if (error instanceof Error) {
      return reply.badRequest(error.message);
    }
    return reply.internalServerError();
  }
}

export default newTournamentHandler;
