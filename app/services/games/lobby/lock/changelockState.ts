import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function changeLockState(
  lobbyId: string,
  memberId: string,
  state: boolean,
): void {
  PrivateLobbies.get(lobbyId)?.changeLockState(memberId, state);
  PublicLobbies.get(lobbyId)?.changeLockState(memberId, state);
}

export { changeLockState };
