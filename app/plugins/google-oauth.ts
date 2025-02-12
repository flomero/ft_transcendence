import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin'
import oauthPlugin from '@fastify/oauth2';

const googleOAuthPlugin: FastifyPluginAsync = async (fastify, opts) => {
    fastify.register(oauthPlugin, {
        name: 'googleOAuth2',
        credentials: {
            client: {
                id: process.env.GOOGLE_CLIENT_ID!,
                secret: process.env.GOOGLE_CLIENT_SECRET!
            },
            auth: oauthPlugin.GOOGLE_CONFIGURATION
        },
        scope: ['profile', 'email'],
        startRedirectPath: '/login/google',
        callbackUri: 'http://localhost:3000/login/google/callback'
    });

    fastify.get('/login/google/callback', async (request, reply) => {
        try {
            const token = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
            console.log('Token:', token);
            reply.send(token);
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send(error);
        }
    });
};

export default fp(googleOAuthPlugin, {
    name: 'plugin-google-oauth'
});