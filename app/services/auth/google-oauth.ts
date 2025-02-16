import { FastifyInstance } from "fastify";
import { JWTContent, signJWT } from "./jwt";

export async function refreshJWT(fastify: FastifyInstance, token: JWTContent): Promise<string> {
    const refreshedToken = await fastify.googleOAuth2.getNewAccessTokenUsingRefreshToken(token.token, {})

    token.token.access_token = refreshedToken.token.access_token;
    token.token.expires_at = refreshedToken.token.expires_at;
    token.token.expires_in = refreshedToken.token.expires_in;
    token.token.id_token = refreshedToken.token.id_token;

    const jwtContent: JWTContent = {
        id: token.id,
        name: token.name,
        token: token.token
    }

    return await signJWT(fastify, jwtContent);
}
