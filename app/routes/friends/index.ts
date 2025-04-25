import type { FastifyPluginAsync } from "fastify";
import { getFriendsWithUserInfo } from "../../services/database/friend/friends";
import { usersToUserWithImages } from "../../services/database/user";
import { getInvitesWithUserInfo } from "../../services/database/friend/invites";
import { searchUsers } from "../../services/friends/search";
import { getBlockedUsersWithUserInfo } from "../../services/friends/block";

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
      title: "Your Friends | ft_transcendence",
      activeView: "friends",
      friends: usersToUserWithImages(friends),
    };
    reply.header("X-Page-Title", "Your Friends | ft_transcendence");
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
      title: "Open Requests | ft_transcendence",
      activeView: "requests",
      friends: usersToUserWithImages(invites),
    };
    reply.header("X-Page-Title", "Open Requests | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/new", async (request, reply) => {
    const data = {
      title: "Add Friends | ft_transcendence",
      activeView: "new",
    };
    reply.header("X-Page-Title", "Add Friends | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/blocked", async (request, reply) => {
    const data = {
      title: "Blocked Users | ft_transcendence",
      activeView: "blocked",
      blockedUsers: await getBlockedUsersWithUserInfo(fastify, request.userId),
    };
    reply.header("X-Page-Title", "Blocked Users | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/friends/index", data, viewOptions);
  });

  fastify.get("/search/:username", async (request, reply) => {
    const { username } = request.params as { username: string };
    if (!username) return reply.badRequest("Username required");
    if (username.length < 3)
      return reply.badRequest("Username must be at least 3 characters");

    try {
      const users = await searchUsers(fastify, request.userId, username);

      return reply.view("views/friends/search", {
        friends: users,
      });
    } catch (error) {
      if (error instanceof Error)
        return reply.internalServerError(error.message);
      return reply.internalServerError();
    }
  });
};

export default friends;
