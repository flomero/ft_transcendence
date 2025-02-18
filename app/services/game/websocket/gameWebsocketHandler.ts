import { FastifyRequest } from "fastify";
import { WebSocket } from 'ws';


const gameWebsocketHandler = async (connection: WebSocket, request: FastifyRequest): Promise<void> => {
	connection.send("hallo");
  connection.on('message', (message) => {
    connection.send(`echo: ${message}`);
    console.log('received: %s', message);
  });
}

export default gameWebsocketHandler;
