import { Token } from "@fastify/oauth2";
import { FastifyInstance } from "fastify";
export interface JWTContent {
    id: string;
    name: string;
    token: Token;
}

export async function signJWT(fastify: FastifyInstance, content: JWTContent): Promise<string> {
    return await fastify.jwt.sign(content, {
        expiresIn: content.token.expires_in,
    });
}

export async function verifyJWT(fastify: FastifyInstance, token: string): Promise<JWTContent> {
    return await fastify.jwt.verify<JWTContent>(token);
}

export async function decodeJWT(fastify: FastifyInstance, token: string): Promise<JWTContent | null> {
    return await fastify.jwt.decode<JWTContent>(token);
}
