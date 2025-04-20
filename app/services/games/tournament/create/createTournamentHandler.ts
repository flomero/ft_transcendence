import { FastifyRequest, FastifyReply } from "fastify";
//import { randomUUID } from "crypto";
import { CreateTournamentBody } from "../../../../interfaces/games/tournament/CreateTournamentBody";
// import { canTournamentBeCreatedCheck } from "../../validationTournament/canTournamentBeCreatedCheck";
import TournamentManager from "../TournamentManager";

// Store active tournaments
export const tournaments = new Map<string, TournamentManager>();

async function createTournamentHandler(
  request: FastifyRequest<{ Body: CreateTournamentBody }>,
  reply: FastifyReply,
) {
  try {
    //    const userId = request.userId;
    //    const body = request.body;
    request.log.info("Creating tournament");

    return reply.code(201).send({ message: "Created" });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default createTournamentHandler;
