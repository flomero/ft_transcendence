import type { Lobby } from "../Lobby";
import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

function getLobby(lobbyId: string): Lobby {
  if (PublicLobbies.has(lobbyId)) {
    return PublicLobbies.get(lobbyId)!;
  }
  if (PrivateLobbies.has(lobbyId)) {
    return PrivateLobbies.get(lobbyId)!;
  }
  throw new Error("[getLobby] Lobby does not exist");
}

function lobbyExists(lobbyId: string): boolean {
  return PublicLobbies.has(lobbyId) || PrivateLobbies.has(lobbyId);
}

export { getLobby, lobbyExists };
