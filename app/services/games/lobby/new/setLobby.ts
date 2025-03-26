import { PrivateLobbies, PublicLobbies } from "./newLobbyHandler";
import { Lobby } from "../Lobby";

const setLobby = (lobby: Lobby, state: "public" | "private"): void => {
  if (state === "public") {
    PublicLobbies.set(lobby.getLobbyId, lobby);
  } else {
    PrivateLobbies.set(lobby.getLobbyId, lobby);
  }
};

export { setLobby };
