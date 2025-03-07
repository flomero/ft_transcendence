import type { GameModes } from "../../../types/games/GameModes";

interface NewLobbyRequestBody {
  gameName: "pong";
  gameModeName: GameModes;
  modifierNames: string[];
  powerUpNames: string[];
  lobbyMode: "public" | "private";
}

export type { NewLobbyRequestBody };
