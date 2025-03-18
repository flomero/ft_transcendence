import fp from "fastify-plugin";
import cookie, { type FastifyCookieOptions } from "@fastify/cookie";

export default fp(async (fastify, opts) => {
  fastify.register(cookie, {
    secret: fastify.config.COOKIE_SECRET,
    hook: "onRequest",
    parseOptions: {
      secure: "auto",
      sameSite: "strict",
      httpOnly: false,
    },
  } as FastifyCookieOptions);
});
