import { FastifyPluginAsync } from 'fastify';
import { handleSendFriendRequest } from '../../services/friends/handleSendFriendRequest';
import friendRequestSchema from '../../schemas/friends/friendRequestSchema';
//import { userHook } from './testAddUser';

const sendFriendRequest: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.post('/send-friend-request', {
        schema: friendRequestSchema,
       // preHandler: userHook,
        handler: handleSendFriendRequest
    });
}

export default sendFriendRequest;