import { getLobby } from "../lobbyWebsocket/getLobby";

const isUserOwnerOfLobby = (userId: string, lobbyId: string): boolean => {
  const lobby = getLobby(lobbyId);
  if (lobby.isMemberOwner(userId) === true) {
    return true;
  }
  return false;
};

export default isUserOwnerOfLobby;
