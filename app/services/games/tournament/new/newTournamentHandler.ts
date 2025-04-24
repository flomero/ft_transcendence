import { FastifyRequest, FastifyReply } from "fastify";
import canTournamentBeCreatedCheck from "./canTournamentBeCreatedCheck";
import TournamentManager from "../TournamentManager";

// Store active tournaments
export const tournaments = new Map<string, TournamentManager>();

async function newTournamentHandler(
  request: FastifyRequest<{
    Params: { gameMode: string; tournamentMode: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    canTournamentBeCreatedCheck(userId);
    //  const newTournament = new TournamentManager(tournamentSettings, userId);
    //  tournaments.set(newTournament.tournamentId, newTournament);
    return reply.code(201).send({ tournamentId: "1234" });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ error: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default newTournamentHandler;
