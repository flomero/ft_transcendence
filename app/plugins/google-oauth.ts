import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import oauthPlugin from "@fastify/oauth2";
import type { OAuth2Namespace } from "@fastify/oauth2";
import { signJWT } from "../services/auth/jwt";
import { getGoogleProfile } from "../services/auth/google-api";
import { insertUser } from "../services/auth/newUser";
import { getUserById } from "../services/database/user";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

const googleOAuthPlugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.register(oauthPlugin, {
    name: "googleOAuth2",
    credentials: {
      client: {
        id: fastify.config.GOOGLE_CLIENT_ID,
        secret: fastify.config.GOOGLE_CLIENT_SECRET,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    scope: ["profile", "email"],
    startRedirectPath: "/login/google",
    callbackUri: `${fastify.config.PUBLIC_URL}/login/google/callback`,
    callbackUriParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });

  fastify.get("/login/google/callback", async (request, reply) => {
    try {
      const token =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request,
        );
      if (!token || !token.token) {
        throw new Error("Invalid or null token received");
      }
      const googleUserInfo = await getGoogleProfile(token.token.access_token);
      if (!googleUserInfo.verified_email) {
        throw new Error("Google account not verified");
      }

      await insertUser(fastify, googleUserInfo);
      const user = await getUserById(fastify, googleUserInfo.id);
      if (!user) {
        reply.internalServerError(
          "User could not be inserted into the database",
        );
        return;
      }

      const jwtToken = await signJWT(fastify, {
        id: user.id,
        name: user.username,
        token: token.token,
      });

      reply.cookie("token", jwtToken, {
        path: "/",
      });
      reply.redirect("/login/reload");
      fastify.customMetrics.googleLogin("success");
    } catch (error) {
      fastify.log.error(error);
      fastify.customMetrics.googleLogin("failure");
      if (error instanceof Error)
        return reply.internalServerError(error.message);
      return reply.internalServerError();
    }
  });
};

export default fp(googleOAuthPlugin, {
  name: "plugin-google-oauth",
});
