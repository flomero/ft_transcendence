import { FastifyPluginAsync } from 'fastify';
import { handleSendFriendRequest } from '../../services/friends/handleSendFriendRequest';
import friendRequestSchema from '../../schemas/friends/friendRequestSchema';

const send_friend_request: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	  fastify.post('/send-friend-request', { schema: friendRequestSchema }, handleSendFriendRequest);
}

export default send_friend_request;