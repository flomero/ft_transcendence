import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function isLobbyClosed(lobbyId: string): boolean {
  const publicLobbies = PublicLobbies.get(lobbyId);
  const privateLobbies = PrivateLobbies.get(lobbyId);

  if (
    publicLobbies?.isLobbyLocked === true ||
    privateLobbies?.isLobbyLocked === true
  ) {
    return true;
  }
  return false;
}

export default isLobbyClosed;
