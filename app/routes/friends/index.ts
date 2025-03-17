import type { FastifyPluginAsync } from "fastify";
import { getFriendsWithUserInfo } from "../../services/database/friend/friends";
import { usersToUserWithImages } from "../../services/database/user";
import { getInvitesWithUserInfo } from "../../services/database/friend/invites";
import { searchUsers } from "../../services/friends/search";

function getPartnerId(
  relationship: { senderId: string; receiverId: string },
  userId: string,
): string {
  return relationship.receiverId === userId
    ? relationship.senderId
    : relationship.receiverId;
}

function assignPartnerIds<T extends { senderId: string; receiverId: string }>(
  relationships: T[],
  userId: string,
): (T & { id: string })[] {
  return relationships.map((item) => ({
    ...item,
    id: getPartnerId(item, userId),
  }));
}

const friends: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    let friends = await getFriendsWithUserInfo(fastify, request.userId);
    friends = assignPartnerIds(friends, request.userId);
    const data = {
      activeView: "friends",
      friends: usersToUserWithImages(friends),
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/requests", async (request, reply) => {
    let invites = await getInvitesWithUserInfo(fastify, request.userId);
    invites = invites.map((item) => ({
      ...item,
      id: item.senderId,
    }));
    const data = {
      activeView: "requests",
      friends: usersToUserWithImages(invites),
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/new", async (request, reply) => {
    const data = {
      activeView: "new",
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/search/:username", async (request, reply) => {
    const { username } = request.params as { username: string };
    if (!username) {
      return reply.status(400).send({ message: "Username required" });
    }
    if (username.length < 3) {
      return reply
        .status(400)
        .send({ message: "Username must be at least 3 characters" });
    }

    try {
      const users = await searchUsers(fastify, request.userId, username);

      return reply.view("views/friends/search", {
        friends: users,
      });
    } catch (error) {
      return reply
        .status(500)
        .send({ message: `Internal server error ${error}` });
    }
  });
};

export default friends;
