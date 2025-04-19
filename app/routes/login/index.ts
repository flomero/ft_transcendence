import type { FastifyPluginAsync } from "fastify";
import { redirectTo } from "../../services/routing/redirect";

const login: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    if (request.isAuthenticated) {
      return redirectTo(request, reply, "/", true);
    }
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/noauth" };
    return reply.view(
      "views/login",
      { title: "Login | ft_transcendence" },
      viewOptions,
    );
  });
  fastify.get("/reload", async (request, reply) => {
    if (request.isAuthenticated) {
      return redirectTo(request, reply, "/", true);
    }
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/noauth" };
    return reply.view(
      "views/loginreload",
      { title: "Login | ft_transcendence" },
      viewOptions,
    );
  });
};

export default login;
