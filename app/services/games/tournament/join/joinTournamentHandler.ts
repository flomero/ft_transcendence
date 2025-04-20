import { FastifyRequest, FastifyReply } from "fastify";

async function joinTournamentHandler(
  request: FastifyRequest<{ Params: { tournamentId: string } }>,
  reply: FastifyReply,
) {
  try {
    //    const { tournamentId } = request.params;
    //    const userId = request.userId;

    request.log.info("Joining tournament");
    return reply.code(200).send({ message: "Tournament joined successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default joinTournamentHandler;
