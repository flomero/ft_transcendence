import { FastifyPluginAsync } from "fastify";
import handleAcceptFriendRequest from "../../services/friends/handleAcceptFriendRequest";
import friendRequestSchema from "../../schemas/friends/friendRequestSchema";
//import { userHook } from './testAddUser';

const acceptFriendRequest: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.post("/accept-friend-request", {
    schema: friendRequestSchema,
    // preHandler: userHook,
    handler: handleAcceptFriendRequest,
  });
};

export default acceptFriendRequest;
