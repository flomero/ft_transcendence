import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import validTournamentConnectionCheck from "../tournamentValidation/validTournamentConnectionCheck";
import { tournaments } from "../tournaments";

async function tournamentWebsocketHandler(
  connection: WebSocket,
  request: FastifyRequest<{ Params: { tournamentId: string } }>,
) {
  const tournamentId = request.params.tournamentId;
  const userId = request.userId;
  const tournament = tournaments.get(tournamentId);

  try {
    connection.send(`Welcome to the tournament ${tournamentId}`);
    validTournamentConnectionCheck(userId, tournamentId);
    tournament?.setMemberSocket(userId, connection);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in tournamentWebsocketHandler: ${error.message}`);
      connection.close(1000, `Error: ${error.message}`);
    }
  }
}

export default tournamentWebsocketHandler;
