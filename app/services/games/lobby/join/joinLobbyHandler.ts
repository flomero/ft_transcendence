import type { FastifyRequest, FastifyReply } from "fastify";
import { isUserInAnyLobby } from "../lobbyVaidation/isUserInAnyLobby";
import { isLobbyRegistered } from "../lobbyVaidation/isLobbyRegistered";
import addUserToExistingLobby from "./addUserToExistingLobby";
import isLobbyOpen from "../lobbyVaidation/isLobbyOpen";
import getLobbyById from "../getters/getLobbyById";
import { getLobby } from "../lobbyWebsocket/getLobby";

async function joinLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  const userLobby = isUserInAnyLobby(userId);
  let newUser = true;
  if (userLobby === lobbyId) {
    newUser = false;
  } else if (userLobby !== null) {
    return reply.badRequest("User is already in a lobby");
  }
  if (isLobbyRegistered(lobbyId) === false) {
    return reply.badRequest("Lobby does not exist 1");
  }
  if (isLobbyOpen(lobbyId) === false) {
    return reply.badRequest("Lobby is not open");
  }
  if (newUser) {
    try {
      addUserToExistingLobby(lobbyId, userId);
    } catch (error) {
      if (error instanceof Error) {
        return reply.badRequest(error.message);
      }
    }
  }
  const lobby = await getLobbyById(request.server, lobbyId, true);
  if (lobby === null) {
    return reply.notFound("Lobby not found");
  }
  const realLobby = getLobby(lobbyId);
  const data = {
    title: "Lobby | ft_transcendence",
    lobby: lobby,
    isReady: realLobby.getMember(userId)?.isReady || false,
    isOwner: realLobby.isMemberOwner(userId),
    allMembersReady:
      realLobby.allMembersReady() && realLobby.reachedMinPlayers(),
    // lobbyString: JSON.stringify(lobby),
  };

  reply.header("X-Page-Title", "Lobby | ft_transcendence");
  const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
  return reply.view("views/lobby/page", data, viewOptions);
}

export default joinLobbyHandler;
