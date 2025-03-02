import { FastifyPluginAsync } from "fastify";

interface ChatMessageResponse {
    html: string;
}

const chatWebSocket: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.get('/ws', { websocket: true }, async function (socket, request) {
        fastify.log.debug('Chat client connected');

        socket.on('message', async function (message) {
            fastify.log.debug('Received message: ' + message);

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