import fastify from "fastify";

fastify.addHook('onRequest', (request, reply, done) => {
  // Some code
  done()
})
export { userHook };