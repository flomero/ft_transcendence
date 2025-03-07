import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
//import { PublicLobbies } from '../new/newLobbyHandler';
//import { PrivateLobbies } from '../new/newLobbyHandler';
import { isLobbyRegistered } from './lobbyVaidation/isLobbyRegistered';

const lobbyWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest,
): Promise<void> => {
  const lobbyId = request.params.lobbyId;

  if (isLobbyRegistered(lobbyId) == false) {
    connection.close();
    return;
  }

};

export default lobbyWebsocketHandler;
