import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin'
import oauthPlugin from '@fastify/oauth2';
import { OAuth2Token } from '@fastify/oauth2';

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

async function getGoogleProfile(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Google profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data as GoogleUserInfo;
}

export interface JWTContent {
    id: string;
    name: string;
    token: OAuth2Token;
}

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
            const token = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request) as OAuth2Token;
            const userInfo = await getGoogleProfile(token.token.access_token);
            if (!userInfo.verified_email) {
                throw new Error('Google account not verified');
            }

            const jwtContent: JWTContent = {
                id: userInfo.id,
                name: userInfo.name,
                token: token
            }

            const jwtToken = await fastify.jwt.sign(jwtContent, {
                expiresIn: token.token.expires_in,
            });

            reply.send(jwtToken);
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send(error);
        }
    });
};

export default fp(googleOAuthPlugin, {
    name: 'plugin-google-oauth'
});