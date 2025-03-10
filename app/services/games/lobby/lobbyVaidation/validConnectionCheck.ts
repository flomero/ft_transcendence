import { isUserRegistered } from "./isUserRegistered";
import { isLobbyRegistered } from "./isLobbyRegistered";

export function validConnectionCheck(username: string, lobbyId: string): void {
  if (isLobbyRegistered(lobbyId) === false)
    throw new Error("Lobby does not exist");
  else if (isUserRegistered(username, lobbyId) === false)
    throw new Error("User is not registered in this lobby");
}
