import type { FastifyReply, FastifyRequest } from "fastify";

export function redirectTo(
  request: FastifyRequest,
  reply: FastifyReply,
  path: string,
  noAjax = false,
) {
  if (request.isAjax() && !noAjax) {
    return reply
      .header("X-SPA-Redirect", path)
      .status(200)
      .send({ redirectTo: path });
  }

  reply.removeHeader("X-SPA-Redirect");
  return reply.redirect(path);
}
