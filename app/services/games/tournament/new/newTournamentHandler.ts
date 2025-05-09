import type { FastifyRequest, FastifyReply } from "fastify";
import canTournamentBeCreatedCheck from "./canTournamentBeCreatedCheck";
import TournamentManager from "../TournamentManager";
import { gameModeFromString } from "../../../config/gameModes";
import { TournamentGameModes } from "../../../../config";
import { tournamentConfigFromString } from "../../../config/tournamentConfig";
import { tournaments } from "../tournaments";

async function newTournamentHandler(
  request: FastifyRequest<{
    Params: {
      gameModeName: string;
      tournamentConfigName: string;
      tournamentSize: string;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    const tournamentSize = Number(request.params.tournamentSize);
    const gameMode = gameModeFromString(
      request.params.gameModeName,
      TournamentGameModes,
    );
    const tournamentConfigKey = tournamentConfigFromString(
      request.params.tournamentConfigName,
    );
    if (!gameMode || !tournamentConfigKey)
      return reply.badRequest("Invalid game mode or tournament config");

    canTournamentBeCreatedCheck(
      userId,
      gameMode,
      tournamentSize,
      tournamentConfigKey,
    );

    const newTournament = new TournamentManager(
      tournamentConfigKey,
      userId,
      gameMode,
      tournamentSize,
      request.server.sqlite,
    );
    tournaments.set(newTournament.tournamentId, newTournament);

    return reply.code(201).send({ tournamentId: newTournament.tournamentId });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.internalServerError();
  }
}

export default newTournamentHandler;
