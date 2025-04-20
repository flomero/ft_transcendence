import { FastifyRequest, FastifyReply } from "fastify";
import { CreateTournamentBody } from "../../../../interfaces/games/tournament/CreateTournamentBody";
import canTournamentBeCreatedCheck from "./canTournamentBeCreatedCheck";
import TournamentManager from "../TournamentManager";

// Store active tournaments
export const tournaments = new Map<string, TournamentManager>();

async function newTournamentHandler(
  request: FastifyRequest<{ Body: CreateTournamentBody }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    canTournamentBeCreatedCheck(userId);

    return reply.code(201).send({ message: "Created" });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default newTournamentHandler;
