import GameManager from "../../gameHandler/GameManager";
import { createNewGameClass } from "./createNewGameClass";
import { getLobby } from "../lobbyWebsocket/getLobby";
import { LobbyMember } from "../../../../types/games/lobby/LobbyMember";
import { GameOrigin } from "../../../../types/games/gameHandler/GameOrigin";

const gameManagerCreate = (lobbyId: string) => {
  const game = createNewGameClass(lobbyId);
  const gameOrigin = createGameOrigin(lobbyId);
  const gameManager = new GameManager(game, gameOrigin);
  addTransferMemberToGameManager(gameManager, lobbyId);
  return gameManager;
};

const createGameOrigin = (lobbyId: string) => {
  const lobbyClass = getLobby(lobbyId);

  const gameOrigin: GameOrigin = {
    type: "lobby",
    lobby: lobbyClass,
  };
  return gameOrigin;
};

const addTransferMemberToGameManager = (
  gameManager: GameManager,
  lobbyId: string,
) => {
  const lobby = getLobby(lobbyId);
  const lobbyMember = lobby.getMemberAsArray();
  addPlayerToGameManager(gameManager, lobbyMember);
  addAiToGameManager(gameManager, lobbyMember);
};

const addPlayerToGameManager = (
  gameManager: GameManager,
  lobbyMember: LobbyMember[],
) => {
  for (const member of lobbyMember) {
    if (member.isAi === false) gameManager.addPlayer(member.id);
  }
};

const addAiToGameManager = (
  gameManager: GameManager,
  lobbyMember: LobbyMember[],
) => {
  for (const aiOpponentId of lobbyMember) {
    if (aiOpponentId.isAi === true) gameManager.addAiOpponent(aiOpponentId.id);
  }
};

export default gameManagerCreate;
