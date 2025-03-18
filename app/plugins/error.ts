import fp from "fastify-plugin";

export default fp(async (fastify, opts) => {
  fastify.setErrorHandler(async (error, request, reply) => {
    const viewOptions = request.isAjax()
      ? {}
      : {
          layout: request.isAuthenticated
            ? "layouts/main.hbs"
            : "layouts/noauth.hbs",
        };
    return reply.view(
      "views/error.hbs",
      {
        error: error.name,
        message: error.message,
        statusCode: error.statusCode ?? 500,
      },
      viewOptions,
    );
  });
  fastify.setNotFoundHandler(async (request, reply) => {
    const viewOptions = request.isAjax()
      ? {}
      : {
          layout: request.isAuthenticated
            ? "layouts/main.hbs"
            : "layouts/noauth.hbs",
        };
    return reply.view(
      "views/error.hbs",
      {
        error: "Not Found.",
        message: "The requested resource was not found.",
        statusCode: "404",
      },
      viewOptions,
    );
  });
});
