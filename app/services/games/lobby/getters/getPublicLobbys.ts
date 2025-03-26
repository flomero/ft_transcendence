import { PublicLobbies } from "../new/newLobbyHandler";
import { Lobby } from "../Lobby";

function getPublicLobbies(): Lobby[] {
  return Array.from(PublicLobbies.values());
}

export default getPublicLobbies;
