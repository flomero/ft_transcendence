import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

export function isLobbyRegistered(lobbyId: string): boolean {
  if (PublicLobbies.has(lobbyId) || PrivateLobbies.has(lobbyId))
    return true;
  return (false);
  }
