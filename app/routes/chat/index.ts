import {FastifyPluginAsync} from 'fastify'

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
        });
    })
}

export default chat;