import { Lobby } from "../Lobby";
import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

function getLobby(lobbyId: string): Lobby {
  if (PublicLobbies.has(lobbyId)) {
    return PublicLobbies.get(lobbyId)!;
  } else if (PrivateLobbies.has(lobbyId)) {
    return PrivateLobbies.get(lobbyId)!;
  }
  throw new Error("Lobby does not exist");
}

export { getLobby };
