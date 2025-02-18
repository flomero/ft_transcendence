import { FastifyRequest } from "fastify";
import { WebSocket } from 'ws';


const gameWebsocketHandler = async (connection: WebSocket, request: FastifyRequest): Promise<void> => {
	connection.send("hallo");
}

export default gameWebsocketHandler;