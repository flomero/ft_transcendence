import {FastifyPluginAsync} from 'fastify'
import chatWebSocket from './websocket'

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

    // Register the websocket route
    fastify.register(chatWebSocket);
}

export default chat;