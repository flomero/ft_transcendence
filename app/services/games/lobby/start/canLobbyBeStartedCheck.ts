import isUserInGame from "../../gameHandler/isUserInGame";
import { getLobby } from "../lobbyWebsocket/getLobby";

const canLobbyBeStartedCheck = (lobbyId: string): void => {
  const lobby = getLobby(lobbyId);
  if (lobby.reachedMinPlayers() === false)
    throw new Error("Lobby has not reached minimum players");
  else if (lobby.allMembersConnectedToSocket() === false)
    throw new Error("Not all members are connected to the socket");
  else if (lobby.allMembersReady() === false)
    throw new Error("Not all members are ready");
  else if (isUserInGame(lobby.lobbyOwner) !== null)
    throw new Error("Lobby already started");
};

export { canLobbyBeStartedCheck };
