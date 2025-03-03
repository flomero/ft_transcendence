import fp from "fastify-plugin";
import cookie, { FastifyCookieOptions } from "@fastify/cookie";

export default fp(async function (fastify, opts) {
  fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    hook: "onRequest",
    parseOptions: {
      secure: "auto",
      sameSite: "strict",
      httpOnly: false,
    },
  } as FastifyCookieOptions);
});
