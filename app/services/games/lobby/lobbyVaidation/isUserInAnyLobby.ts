import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";
import type { Lobby } from "../Lobby";

function isUserInAnyLobby(userId: string): string | null {
  const privateResult = isUserInLobby(userId, PrivateLobbies);
  if (privateResult !== null) {
    return privateResult;
  }

  const publicResult = isUserInLobby(userId, PublicLobbies);
  return publicResult;
}

function isUserInLobby(
  userId: string,
  lobbys: Map<string, Lobby>,
): string | null {
  for (const [lobbyId, lobby] of lobbys) {
    if (lobby.isUserInLobby(userId) === true) {
      return lobbyId;
    }
  }
  return null;
}

export { isUserInAnyLobby };
