import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

export function isUserRegistered(username: string, lobbyId: string): boolean {
  if (PrivateLobbies.get(lobbyId)?.isUserInLobby(username) === true)
    return true;
  else if (PublicLobbies.get(lobbyId)?.isUserInLobby(username) === true)
    return true;
  return false;
}
