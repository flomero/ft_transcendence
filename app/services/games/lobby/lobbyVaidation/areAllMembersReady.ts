import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function areAllMembersReady(lobbyId: string): boolean {
  if (
    PrivateLobbies.get(lobbyId)?.allMembersReady ||
    PublicLobbies.get(lobbyId)?.allMembersReady
  ) {
    return true;
  }
  return false;
}

export default areAllMembersReady;
