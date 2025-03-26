import isLobbyOpen from "./isLobbyOpen";
import lobbyHasMinimumPlayers from "../lobbyVaidation/lobbyHasMinimumPlayers";

function canLobbyBeClosedLocked(lobbyId: string): void {
  if (lobbyHasMinimumPlayers(lobbyId) === false) {
    throw new Error("Lobby does not have the minimum amount of players");
  } else if (isLobbyOpen(lobbyId) === false) {
    throw new Error("Lobby is already locked or has been started");
  }
}

export default canLobbyBeClosedLocked;
