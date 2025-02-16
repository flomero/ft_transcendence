import { FastifyPluginAsync } from "fastify"
import handleAcceptFriendRequest from "../../services/friends/handleAcceptFriendRequest";
import friendRequestSchema from '../../schemas/friends/friendRequestSchema';

const acceptFriendRequest: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	  fastify.post('/accept-friend-request', { schema: friendRequestSchema }, handleAcceptFriendRequest);
}

export default acceptFriendRequest;