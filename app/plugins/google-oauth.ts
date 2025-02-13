import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin'
import oauthPlugin from '@fastify/oauth2';
import { OAuth2Namespace } from '@fastify/oauth2';
import { signJWT } from '../services/auth/jwt';
import { getGoogleProfile } from '../services/auth/google-api';

declare module 'fastify' {
    interface FastifyInstance {
        googleOAuth2: OAuth2Namespace;
    }
}

const googleOAuthPlugin: FastifyPluginAsync = async (fastify, opts) => {
    fastify.register(oauthPlugin, {
        name: 'googleOAuth2',
        credentials: {
            client: {
                id: process.env.GOOGLE_CLIENT_ID!,
                secret: process.env.GOOGLE_CLIENT_SECRET!
            },
            auth: oauthPlugin.GOOGLE_CONFIGURATION,
        },
        scope: ['profile', 'email'],
        startRedirectPath: '/login/google',
        callbackUri: process.env.PUBLIC_URL + '/login/google/callback',
        callbackUriParams: {
            access_type: 'offline',
            prompt: 'consent'
        }
    });

    fastify.get('/login/google/callback', async (request, reply) => {
        try {
            const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
            const userInfo = await getGoogleProfile(token.token.access_token);
            if (!userInfo.verified_email) {
                throw new Error('Google account not verified');
            }

            const jwtToken = await signJWT(fastify, {
                id: userInfo.id,
                name: userInfo.name,
                token: token.token
            });

            reply.cookie('token', jwtToken, {
                path: '/',
            });
            reply.redirect('/');
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send(error);
        }
    });
};

export default fp(googleOAuthPlugin, {
    name: 'plugin-google-oauth'
});