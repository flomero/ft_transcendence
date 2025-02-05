import { FastifyInstance } from 'fastify';
import oauth2 from '@fastify/oauth2';

export async function oauthRoutes(fastify: FastifyInstance, options: any) {
    fastify.register(oauth2, {
        name: 'googleOAuth2',
        scope: ['profile', 'email'],
        credentials: {
            client: {
                id: 'YOUR_GOOGLE_CLIENT_ID',
                secret: 'YOUR_GOOGLE_CLIENT_SECRET'
            },
            auth: oauth2.GOOGLE_CONFIGURATION
        },
        startRedirectPath: '/login/google',
        callbackUri: 'http://localhost:8080/login/google/callback'
    });

    fastify.get('/protected', async (request, reply) => {
        return { message: 'You have accessed a protected endpoint.' };
    });
}

export default oauthRoutes;
