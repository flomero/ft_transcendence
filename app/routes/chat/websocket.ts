import { FastifyPluginAsync } from "fastify";
import {postMessage} from "../../services/chat/message";

interface ChatMessageResponse {
    html: string;
}

const chatWebSocket: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.get('/ws', { websocket: true }, async function (socket, request) {
        fastify.log.trace('Chat client connected');

        socket.on('message', async function (message) {
            fastify.log.trace('Received message: ' + message);

            await postMessage(fastify, 1, "110899881598177411832", message.toString());

            const html = await fastify.view('partials/chat/message', {
                message: {
                    userName: "John Doe",
                    message: message,
                    timestamp: new Date().toLocaleString(),
                    isOwnMessage: true
                }
            })

            const response: ChatMessageResponse = {
                html: html
            };

            socket.send(JSON.stringify(response));
        });
    });
}

export default chatWebSocket;