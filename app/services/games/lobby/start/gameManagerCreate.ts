import GameManager from "../../gameHandler/GameManager";
import { createNewGameClass } from "./createNewGameClass";
import { getLobby } from "../lobbyWebsocket/getLobby";

const gameManagerCreate = (lobbyId: string) => {
  const game = createNewGameClass(lobbyId);
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

export default gameManagerCreate;
