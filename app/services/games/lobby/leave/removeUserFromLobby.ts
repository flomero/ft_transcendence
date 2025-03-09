import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

function removeUserFromLobby(userId: string, lobbyId: string): void {
  if (PublicLobbies.has(lobbyId)
      && PublicLobbies.get(lobbyId)!.isUserInLobby(userId) === true) {
    PublicLobbies.get(lobbyId)!.removeMember(userId);
    return;
  }
  else if (PrivateLobbies.has(lobbyId)
      && PrivateLobbies.get(lobbyId)!.isUserInLobby(userId) === true) {
    PrivateLobbies.get(lobbyId)!.removeMember(userId);
    return;
  }
  throw new Error("The user is not part of the provided lobby ID.");
}

export { removeUserFromLobby };
