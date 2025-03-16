import type { FastifyPluginAsync } from "fastify";
import { getFriendsWithUserInfo } from "../../services/database/friend/friends";
import { usersToUserWithImages } from "../../services/database/user";
import { getInvitesWithUserInfo } from "../../services/database/friend/invites";

const friends: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    let friends = await getFriendsWithUserInfo(fastify, request.userId);
    friends = friends.map((friend) => ({
      ...friend,
      id:
        friend.receiverId === request.userId
          ? friend.senderId
          : friend.receiverId,
    }));
    const data = {
      activeView: "friends",
      friends: usersToUserWithImages(friends),
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/requests", async (request, reply) => {
    let invites = await getInvitesWithUserInfo(fastify, request.userId);
    invites = invites.map((invites) => ({
      ...invites,
      id:
        invites.receiverId === request.userId
          ? invites.senderId
          : invites.receiverId,
    }));
    const data = {
      activeView: "requests",
      friends: usersToUserWithImages(invites),
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });
};

export default friends;
