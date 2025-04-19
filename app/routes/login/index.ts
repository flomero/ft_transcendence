import type { FastifyPluginAsync } from "fastify";

const login: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    if (request.isAuthenticated) {
      // For AJAX requests, send a special response instead of a redirect
      if (request.isAjax()) {
        return reply
          .header("X-SPA-Redirect", "/")
          .status(200)
          .send({ redirectTo: "/" });
      }
      return reply.redirect("/");
    }
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/noauth" };
    return reply.view(
      "views/login",
      { title: "Login | ft_transcendence" },
      viewOptions,
    );
  });
};

export default login;
