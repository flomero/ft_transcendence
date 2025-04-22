import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import oauthPlugin from "@fastify/oauth2";
import type { OAuth2Namespace } from "@fastify/oauth2";
import { signJWT } from "../services/auth/jwt";
import { getGoogleProfile } from "../services/auth/google-api";
import { insertUser } from "../services/auth/newUser";

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
      const userInfo = await getGoogleProfile(token.token.access_token);
      if (!userInfo.verified_email) {
        throw new Error("Google account not verified");
      }

      await insertUser(fastify, userInfo);

      const jwtToken = await signJWT(fastify, {
        id: userInfo.id,
        name: userInfo.name,
        token: token.token,
      });

      reply.cookie("token", jwtToken, {
        path: "/",
      });
      reply.redirect("/login/reload");
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(error);
    }
  });
};

export default fp(googleOAuthPlugin, {
  name: "plugin-google-oauth",
});
