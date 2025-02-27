import { FastifyRequest } from "fastify";
import { WebSocket } from 'ws';
import Player from "./Player";
import MatchMaking from "./MatchMaking";
import { gameMessageInterface } from "../../../interfaces/game/gameMessageInterface";
import { getCompiledSchemaValidator, messageCheck } from "./gameMessageParsing";
import convertMessageToGameOptions from "./convetMessageToGameOptions";

const matchMaking = new MatchMaking();
const compiledSchemaValidator = getCompiledSchemaValidator();


const gameWebsocketHandler = async (connection: WebSocket, request: FastifyRequest): Promise<void> => {

  const player = new Player(request.server.userId, connection, request.server.userName);
  const db = request.server.sqlite;

  connection.on('message', async (message) => {

    try {
      const jsonMessage: gameMessageInterface = JSON.parse(message.toString());
      messageCheck(jsonMessage, compiledSchemaValidator);
      const messageType = jsonMessage.messageType;

      if (messageType === 'createMatch' && player.currentState === 'WaitingForMessage') {
        matchMaking.createMatch(player, convertMessageToGameOptions(jsonMessage), db);
      }


    }
    catch (error) {
      if (error instanceof Error)
        connection.send(error.message);
    }
  });
}

export default gameWebsocketHandler;
