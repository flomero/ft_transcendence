import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { PublicLobbies } from "../new/newLobbyHandler";
import { PrivateLobbies } from "../new/newLobbyHandler";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { getActiveLobby } from "./getActiveLobby";
import closePossibleLobbySocketConnection from "../leave/closePossibleLobbySocketConnection";

const lobbyWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
): Promise<void> => {
  const lobbyId = request.params.lobbyId;
  const userId = request.userId;

  try {
    validConnectionCheck(userId, lobbyId);
    const lobby = getActiveLobby(lobbyId);
    lobby.addSocketToMember(userId, connection);

    connection.on("close", () => {
      closePossibleLobbySocketConnection(userId, lobbyId);
    });
  } catch (error) {
    if (error instanceof Error)
      connection.send(JSON.stringify({ error: error.message }));
    connection.close();
    printLobbys();
    return;
  }
};

function printLobbys() {
  console.log("PublicLobbies:", PublicLobbies);
  console.log("PrivateLobbies:", PrivateLobbies);
}

export default lobbyWebsocketHandler;
