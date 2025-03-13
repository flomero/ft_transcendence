import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function setReadyState(lobbyId: string, userId: string, readyState: boolean) {
  PrivateLobbies.get(lobbyId)?.setMemberReadyState(userId, readyState);
  PublicLobbies.get(lobbyId)?.setMemberReadyState(userId, readyState);
}

export { setReadyState };
