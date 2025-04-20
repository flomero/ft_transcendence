import { GameSettings } from "./GameSettings";

interface NewLobbyRequestBody extends GameSettings {
  lobbyMode: "public" | "private";
}

export default NewLobbyRequestBody;
