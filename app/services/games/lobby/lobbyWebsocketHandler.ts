import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
//import { PublicLobbies } from "../new/newLobbyHandler";
//import { PrivateLobbies } from "../new/newLobbyHandler";
import { validConnectionCheck } from "./lobbyVaidation/validConnectionCheck";

const lobbyWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
): Promise<void> => {
  const lobbyId = request.params.lobbyId;

  try {
    validConnectionCheck(request.userId, lobbyId);
  }
  catch (error) {
    if (error instanceof Error)
      connection.send(JSON.stringify({ error: error.message }));
    connection.close();
    return;
  }

  connection.on('onClose', () => {
    //remove user from lobby
  });
};

export default lobbyWebsocketHandler;
