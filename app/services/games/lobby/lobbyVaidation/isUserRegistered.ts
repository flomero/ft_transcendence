import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

export function isUserRegistered(username: string, lobbyId: string): boolean {
  if (PublicLobbies.has(username) || PrivateLobbies.has(username)) {
    return true;
  } else {
    return false;
  }
}
