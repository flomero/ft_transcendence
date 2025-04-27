import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

function lobbyHasMinimumPlayers(lobbyId: string): boolean {
  if (PublicLobbies.get(lobbyId)?.reachedMinPlayers() === true) {
    return true;
  } else if (PrivateLobbies.get(lobbyId)?.reachedMinPlayers() === true) {
    return true;
  }
  return false;
}

export default lobbyHasMinimumPlayers;
