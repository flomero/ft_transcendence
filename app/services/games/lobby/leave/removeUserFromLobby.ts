import { getLobby } from "../lobbyWebsocket/getLobby";

function removeUserFromLobby(userId: string, lobbyId: string): void {
  const lobby = getLobby(lobbyId);
  if (lobby.isUserInLobby(userId) === true) {
    lobby.removeMember(userId);
    return;
  }
  throw new Error("The user is not part of the provided lobby ID.");
}

export { removeUserFromLobby };
