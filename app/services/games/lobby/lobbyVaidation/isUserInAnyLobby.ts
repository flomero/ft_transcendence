import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";
import { Lobby } from "../Lobby";

function isUserInAnyLobby(userId: string): boolean {
  if (isUserInLobby(userId, PrivateLobbies) === true) return true;
  else if (isUserInLobby(userId, PublicLobbies) === true) return true;
  return false;
}

function isUserInLobby(userId: string, lobbys: Map<string, Lobby>): boolean {
  for (let [_, lobby] of lobbys) {
    if (lobby.isUserInLobby(userId) === true) {
      return true;
    }
  }
  return false;
}

export { isUserInAnyLobby };
