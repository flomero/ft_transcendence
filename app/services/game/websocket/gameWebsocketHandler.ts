import { FastifyRequest } from "fastify";
import { WebSocket } from 'ws';


const gameWebsocketHandler = async (connection: WebSocket, request: FastifyRequest): Promise<void> => {
	connection.send("hallo");
  connection.on('message', (message) => {
    connection.send(`echo: ${message} from user: ${request.server.userId}`);
    console.log('received: %s, user: %s', message, request.server.userId);
  });
}

export default gameWebsocketHandler;
