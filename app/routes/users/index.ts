import type { FastifyPluginAsync } from "fastify";
import { getUserById } from "../../services/database/user";
import { isFriend } from "../../services/database/friend/friends";
import { hasInvite } from "../../services/database/friend/invites";
import { getMatchHistoryService } from "../../services/database/match-history";
import { redirectTo } from "../../services/routing/redirect";
import { isBlocked } from "../../services/database/friend/block";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) return reply.badRequest("User Id required");
    if (userId === request.userId)
      return redirectTo(request, reply, "/profile");
    const userData = await getUserById(fastify, userId);
    if (!userData) return reply.notFound("User not found");

    const isFriendOfCurrentUser = await isFriend(
      fastify,
      request.userId,
      userId,
    );
    const userIsBlocked = await isBlocked(fastify, request.userId, userId);

    const requestSent = await hasInvite(fastify, request.userId, userId);
    const requestReceived = await hasInvite(fastify, userId, request.userId);

    const showFriendButton =
      !isFriendOfCurrentUser &&
      !requestSent &&
      !requestReceived &&
      !userIsBlocked;
    const showRemoveButton = isFriendOfCurrentUser;
    const showRequestButtons =
      !isFriendOfCurrentUser && requestReceived && !userIsBlocked;

    // Fetch match history for the specified user
    const matchHistory = await getMatchHistoryService(fastify, userId);

    const data = {
      userId: userData.id,
      userName: userData.username,
      imageUrl: `/image/${userData.image_id}`,
      matches: matchHistory,
      requestSent: requestSent,
      showFriendButton: showFriendButton,
      showRemoveButton: showRemoveButton,
      showRequestButtons: showRequestButtons,
      isBlocked: userIsBlocked,
      showText: true,
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/user", data, viewOptions);
  });
};

export default profile;
