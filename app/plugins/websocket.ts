import websocketPlugin from '@fastify/websocket';
import fp from 'fastify-plugin'

/**
 * This plugins adds websocket support
 * @see https://github.com/fastify/fastify-websocket
 */

export default fp(async (fastify) => {
  fastify.register(websocketPlugin)
})