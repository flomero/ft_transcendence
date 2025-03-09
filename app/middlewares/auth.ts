import fp from "fastify-plugin";
import { decodeJWT, verifyJWT } from "../services/auth/jwt";
import { refreshJWT } from "../services/auth/google-oauth";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userName: string;
    isAuthenticated: boolean;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest("userId", "");
  fastify.decorateRequest("userName", "");
  fastify.decorateRequest("isAuthenticated", false);

  fastify.addHook("onRequest", async (req, reply) => {
    const token = req.cookies.token;
    if (!token) {
      return;
    }

    try {
      const decoded = await verifyJWT(fastify, token);
      req.userId = decoded.id;
      req.userName = decoded.name;
      req.isAuthenticated = true;
    } catch (err: any) {
      if (err.code === "FAST_JWT_EXPIRED") {
        fastify.log.debug("Token expired, refreshing...");
        try {
          const decoded = await decodeJWT(fastify, token);
          if (!decoded) {
            throw new Error("Could not decode expired token");
          }

          const refreshedJWT = await refreshJWT(fastify, decoded);

          reply.cookie("token", refreshedJWT, {
            path: "/",
          });

          req.userId = decoded.id;
          req.userName = decoded.name;
          req.isAuthenticated = true;
        } catch (err) {
          fastify.log.error("Error refreshing token: ", err);
          fastify.countJwtVerify("failure");
          reply.clearCookie("token");
        }
      } else {
        fastify.log.error("Error verifying token: ", err);
        fastify.countJwtVerify("failure");
        reply.clearCookie("token");
      }
    }
    fastify.countJwtVerify("success");
  });
});
