import GameManager from "../../gameHandler/GameManager";
import { createNewGameClass } from "./createNewGameClass";
import { getLobby } from "../lobbyWebsocket/getLobby";
import { LobbyMember } from "../../../../types/games/lobby/LobbyMember";

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
  addPlayerToGameManager(gameManager, lobbyMember);
  addAiToGameManager(gameManager, lobby.getAiOpponentIds);
};

const addPlayerToGameManager = (
  gameManager: GameManager,
  lobbyMember: LobbyMember[],
) => {
  for (const member of lobbyMember) gameManager.addPlayer(member.id);
};

const addAiToGameManager = (
  gameManager: GameManager,
  aiOpponentIds: number[],
) => {
  for (const aiOpponentId of aiOpponentIds)
    gameManager.addAiOpponent(aiOpponentId);
};

// const printLobby = (lobbyId: string) => {
//   const lobby = getLobby(lobbyId);
//   lobby.sendMessageToAllMembers(
//     JSON.stringify("SETTINGS: " + lobby.getGameSettings),
//   );
// };

export default gameManagerCreate;
