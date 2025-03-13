import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function isLobbyClosed(lobbyId: string): boolean {
  const publicLobbies = PublicLobbies.get(lobbyId);
  const privateLobbies = PrivateLobbies.get(lobbyId);

  if (
    publicLobbies?.lobbyState === "locked" ||
    privateLobbies?.lobbyState === "locked"
  ) {
    return true;
  }
  return false;
}

export default isLobbyClosed;
