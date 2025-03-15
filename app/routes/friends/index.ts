import type { FastifyPluginAsync } from "fastify";
import { getFriendsWithUserInfo } from "../../services/database/friend/friends";
import { usersToUserWithImages } from "../../services/database/user";

const friends: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const friends = await getFriendsWithUserInfo(fastify, request.userId);
    const transformedFriends = friends.map((friend) => ({
      ...friend,
      id:
        friend.receiverId === request.userId
          ? friend.senderId
          : friend.receiverId,
    }));
    const data = { friends: usersToUserWithImages(transformedFriends) };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });
};

export default friends;
