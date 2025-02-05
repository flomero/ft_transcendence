import fastify from 'fastify'
import oauthRoutes from './routes/oauth'

const server = fastify()

server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

server.register(oauthRoutes, { prefix: '/auth' })

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})