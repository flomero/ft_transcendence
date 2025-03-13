import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function lockLobby(lobbyId: string, memberId: string): void {
  PrivateLobbies.get(lobbyId)?.lockLobby(memberId);
  PublicLobbies.get(lobbyId)?.lockLobby(memberId);
}

export default lockLobby;
