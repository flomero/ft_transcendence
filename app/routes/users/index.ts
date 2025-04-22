import type { FastifyPluginAsync } from "fastify";
import { getUserById } from "../../services/database/user";
import { isFriend } from "../../services/database/friend/friends";
import { hasInvite } from "../../services/database/friend/invites";
import { getMatchHistoryService } from "../../services/database/match-history";
import { redirectTo } from "../../services/routing/redirect";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "User Id required" });
    }
    if (userId === request.userId) {
      return redirectTo(request, reply, "/profile");
    }
    const userData = await getUserById(fastify, userId);
    if (!userData) {
      return reply.status(404).send({ message: "User not found" });
    }

    const isFriendOfCurrentUser = await isFriend(
      fastify,
      request.userId,
      userId,
    );

    const requestSent = await hasInvite(fastify, request.userId, userId);

    const requestReceived = await hasInvite(fastify, userId, request.userId);

    const showFriendButton =
      !isFriendOfCurrentUser && !requestSent && !requestReceived;
    const showRemoveButton = isFriendOfCurrentUser;
    const showRequestButtons = !isFriendOfCurrentUser && requestReceived;

    // Fetch match history for the specified user
    const matchHistory = await getMatchHistoryService(fastify, userId);

    const data = {
      userId: userData.id,
      userName: userData.username,
      imageUrl: `/image/${userData.image_id}`,
      matches: matchHistory,
      isFriend: isFriendOfCurrentUser,
      requestSent: requestSent,
      showFriendButton: showFriendButton,
      showRemoveButton: showRemoveButton,
      showRequestButtons: showRequestButtons,
      isBlocked: false, // TODO: add function
      showText: true,
    };

    console.table(data);

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/user", data, viewOptions);
  });
};

export default profile;
