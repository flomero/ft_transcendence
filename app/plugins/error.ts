import fp from "fastify-plugin";

export default fp(async (fastify, _opts) => {
  fastify.setErrorHandler(async (error, request, reply) => {
    const isFetchRequest =
      request.headers.accept?.includes("application/json") && !request.isAjax();

    if (isFetchRequest) {
      reply.code(error.statusCode ?? 500);
      return {
        error: error.name,
        message: error.message,
        statusCode: error.statusCode ?? 500,
      };
    }

    const viewOptions = request.isAjax()
      ? {}
      : {
          layout: request.isAuthenticated
            ? "layouts/main.hbs"
            : "layouts/noauth.hbs",
        };

    reply.code(error.statusCode ?? 500);
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
    const isFetchRequest =
      request.headers.accept?.includes("application/json") && !request.isAjax();

    if (isFetchRequest) {
      reply.code(404);
      return {
        error: "Not Found",
        message: "The requested resource was not found.",
        statusCode: 404,
      };
    }

    const viewOptions = request.isAjax()
      ? {}
      : {
          layout: request.isAuthenticated
            ? "layouts/main.hbs"
            : "layouts/noauth.hbs",
        };

    reply.code(404);
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
