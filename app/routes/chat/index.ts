import {FastifyPluginAsync} from 'fastify'

interface ChatMessageResponse {
    html: string;
}

const chat: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return reply.view('chat', {
            messages: [
                {
                    userName: "John Doe",
                    message: "This is a test message",
                    timestamp: new Date().toLocaleString(),
                    isOwnMessage: false
                },
                {
                    userName: "Jane Peter",
                    message: "I received your message",
                    timestamp: new Date().toLocaleString(),
                    isOwnMessage: true
                }
            ]
        }, { layout: "layouts/main" });
    })

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

export default chat;