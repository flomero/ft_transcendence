import {FastifyPluginAsync} from 'fastify'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.get('/', async function (request, reply) {
        return reply.view('home', { 
            title: 'ft_transcendence',
            isAuthenticated: request.isAuthenticated,
            userId: request.userId,
            userName: request.userName
        });
    })

    fastify.get('/health', async function () {
        return {status: 'ok'}
    })
}

export default root;