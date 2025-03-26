import GameManager from "../../gameHandler/GameManager";
import { createNewGameClass } from "./createNewGameClass";
import { getLobby } from "../lobbyWebsocket/getLobby";

const gameManagerCreate = (lobbyId: string) => {
  const game = createNewGameClass(lobbyId);
  printLobby(lobbyId);
  const gameManager = new GameManager(game);
  addTransferMemberToGameManager(gameManager, lobbyId);
  return gameManager;
};

const addTransferMemberToGameManager = (
  gameManager: GameManager,
  lobbyId: string,
) => {
  const lobby = getLobby(lobbyId);
  const lobbyMember = lobby.getMemberAsArray();
  for (const member of lobbyMember) gameManager.addPlayer(member.id);
};

const printLobby = (lobbyId: string) => {
  const lobby = getLobby(lobbyId);
  lobby.sendMessateToAllMembers(
    JSON.stringify("SETTINGS: " + lobby.getGameSettings),
  );
};

export default gameManagerCreate;
