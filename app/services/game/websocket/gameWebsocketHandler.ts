import { FastifyRequest } from "fastify";
import { WebSocket } from 'ws';
import Player from "./Player";
import MatchMaking from "./MatchMaking";
import { GameOptions } from "./Match";

interface Message {
  type: string;
}

const matchMaking = new MatchMaking();

const gameWebsocketHandler = async (connection: WebSocket, request: FastifyRequest): Promise<void> => {

  const player = new Player(request.server.userId, connection, request.server.userName);
  const db = request.server.sqlite;

  connection.on('message', async (message) => {

    try {
      const parsedMessage: Message = getParsedMessag(message.toString());

      if (parsedMessage.type === 'VanillaDouble') {
        const gameOptions: GameOptions = { gameType: "VanillaDouble" };
        connection.send("You have been added to a match");
      }
    }
    catch (error) {
      connection.send("Invalid message: " + error);
    }
  });
}

function getParsedMessag(message: string): Message {
  const messageObject: Message = JSON.parse(message);
  return messageObject;
}

export default gameWebsocketHandler;
