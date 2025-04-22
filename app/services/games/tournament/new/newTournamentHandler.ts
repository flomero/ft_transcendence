import { FastifyRequest, FastifyReply } from "fastify";
import { TournamentSettings } from "../../../../interfaces/games/tournament/TournamentSettings";
import canTournamentBeCreatedCheck from "./canTournamentBeCreatedCheck";
import TournamentManager from "../TournamentManager";
import validateGameModifierCheck from "../../lobby/lobbyVaidation/validateGameModifierCheck";

// Store active tournaments
export const tournaments = new Map<string, TournamentManager>();

async function newTournamentHandler(
  request: FastifyRequest<{ Body: TournamentSettings }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    const tournamentSettings = request.body;
    canTournamentBeCreatedCheck(userId);
    validateGameModifierCheck(tournamentSettings.gameData);
    const newTournament = new TournamentManager(tournamentSettings, userId);
    tournaments.set(newTournament.tournamentId, newTournament);
    return reply.code(201).send({ tournamentId: newTournament.tournamentId });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ error: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default newTournamentHandler;
