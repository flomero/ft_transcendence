import {FastifyPluginAsync} from 'fastify'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.get('/', async function () {
        return {root: true}
    })

    fastify.get('/health', async function () {
        return {status: 'ok'}
    })
}

export default root;