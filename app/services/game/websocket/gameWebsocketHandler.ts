import { FastifyRequest } from "fastify";
import { WebSocket } from 'ws';
//import Player from "./Player";
//import MatchMaking from "./MatchMaking";
import matchMessageSchema from "../../../schemas/game/matchMessageSchema";
import { gameMessageInterface } from "../../../interfaces/game/gameMessageInterface";
import ajv from "../../../plugins/ajv";

//const matchMaking = new MatchMaking();
const compiledSchemaValidator = getCompiledSchemaValidator();

const gameWebsocketHandler = async (connection: WebSocket, request: FastifyRequest): Promise<void> => {

 // const player = new Player(request.server.userId, connection, request.server.userName);
 //// const db = request.server.sqlite;

  connection.on('message', async (message) => {

    try {
      const jsonMessage: gameMessageInterface = JSON.parse(message.toString());
      messageCheck(jsonMessage);

      connection.send("correct message");

    }
    catch (error) {
      if (error instanceof Error)
        connection.send(error.message);
    }
  });
}

function getCompiledSchemaValidator(): Record<string, (data: unknown) => boolean> {
  const compiledSchemaValidator: Record<string, (data: unknown) => boolean> = {};

  for (const schemaKey in matchMessageSchema) {
    const schemaObject = matchMessageSchema[schemaKey];
    const schemaMessageType = schemaObject.properties.messageType.enum[0];
    compiledSchemaValidator[schemaMessageType] = ajv.compile(matchMessageSchema[schemaKey]);
  }
  return compiledSchemaValidator;
}

function messageCheck(message: gameMessageInterface): void {
  if (message.messageType === undefined)
    throw new Error("Type messageType is missing");
  else if(compiledSchemaValidator[message.messageType] === undefined)
    throw new Error("Type messageType is missing");
  else if (compiledSchemaValidator[message.messageType](message) === false)
    throw new Error("Invalid format: " + compiledSchemaValidator.errors);
}

export default gameWebsocketHandler;
