import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

function addUserToExistingLobby(lobbyId: string, userId: string) {
  if (PrivateLobbies.has(lobbyId))
    PrivateLobbies.get(lobbyId)!.addMember(userId);
  else if (PublicLobbies.has(lobbyId))
    PublicLobbies.get(lobbyId)!.addMember(userId);
  throw new Error("Lobby not found");
}

export default addUserToExistingLobby;
