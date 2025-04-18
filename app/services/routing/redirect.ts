import type { FastifyReply, FastifyRequest } from "fastify";

export function redirectTo(
  request: FastifyRequest,
  reply: FastifyReply,
  path: string,
) {
  if (request.isAjax()) {
    return reply
      .header("X-SPA-Redirect", path)
      .status(200)
      .send({ redirectTo: path });
  }

  return reply.redirect(path);
}
