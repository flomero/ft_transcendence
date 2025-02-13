import { FastifyPluginAsync } from "fastify"
import { friendRequestSchema } from "../../schemas/friends";
import { handle_send_friend_request } from "../../services/friends";

const acceptFriendRequest: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	  fastify.post('/accept-friend-request', { friendRequestSchema }, handle_send_friend_request);
}

export default send_friend_request;