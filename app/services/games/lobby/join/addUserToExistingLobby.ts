import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

function addUserToExistingLobby(lobbyId: string, userId: string) {
  if (PrivateLobbies.has(lobbyId) === true) {
    PrivateLobbies.get(lobbyId)!.addMember(userId);
    return;
  } else if (PublicLobbies.has(lobbyId) === true) {
    PublicLobbies.get(lobbyId)!.addMember(userId);
    return;
  }
  throw new Error("Lobby not found");
}

export default addUserToExistingLobby;
