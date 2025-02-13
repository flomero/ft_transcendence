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

    fastify.addHook('onRequest', (req, _reply, done) => {
        const token = req.cookies['token'];
        if (!token) {
            return done();
        }

        fastify.jwt.verify(token, (err, decoded: JWTContent) => {
            if (err) {
                console.log('Error verifying token', err);
                return done();
            }

            req.userId = decoded.id;
            req.userName = decoded.name;
            req.isAuthenticated = true;
        })
        done();
    })
})