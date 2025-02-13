import fp from 'fastify-plugin'
import { JWTContent } from '../plugins/google-oauth';

declare module 'fastify' {
    interface FastifyRequest {
        userId: string;
        userName: string;
        isAuthenticated: boolean;
    }
}

export default fp(async (fastify) => {
    fastify.decorateRequest('userId', '');
    fastify.decorateRequest('userName', '');
    fastify.decorateRequest('isAuthenticated', false);

    fastify.addHook('onRequest', async (req, reply) => {
        const token = req.cookies.token;
        if (!token) {
            return;
        }

        try {
            const decoded = await fastify.jwt.verify<JWTContent>(token);
            req.userId = decoded.id;
            req.userName = decoded.name;
            req.isAuthenticated = true;
        } catch (err: any) {
            if (err.code === 'FAST_JWT_EXPIRED') {
                try {
                    const decoded = fastify.jwt.decode(token);
                    console.log('Decoded refresh token', decoded);
                    if (!decoded) {
                        throw new Error('Could not decode expired token');
                    }

                    console.log('Refreshed token');
                    const refreshedToken = await fastify.googleOAuth2.getNewAccessTokenUsingRefreshToken(decoded.token, {});
                    console.log('Refreshed token', refreshedToken);
                    const jwtContent: JWTContent = {
                        id: decoded.id,
                        name: decoded.name,
                        token: refreshedToken
                    }
        
                    const jwtToken = await fastify.jwt.sign(jwtContent, {
                        expiresIn: refreshedToken.token.expires_in,
                    });
        
                    reply.cookie('token', jwtToken, {
                        path: '/',
                    });

                    req.userId = decoded.id;
                    req.userName = decoded.name; 
                    req.isAuthenticated = true;
                } catch (error) {
                    fastify.log.error('Error refreshing token', error);
                    // reply.clearCookie('token');
                }
            } else {
                fastify.log.error('Error verifying token', err);
                // reply.clearCookie('token');
            }
        }
    })
})