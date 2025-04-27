import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function isLobbyOpen(lobbyId: string): boolean {
  const publicLobbies = PublicLobbies.get(lobbyId);
  const privateLobbies = PrivateLobbies.get(lobbyId);

  if (
    publicLobbies?.lobbyState === "open" ||
    privateLobbies?.lobbyState === "open"
  ) {
    return true;
  }
  return false;
}

export default isLobbyOpen;
