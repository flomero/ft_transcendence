import { getLobby } from "../lobbyWebsocket/getLobby";

const isUserLastMember = (userId: string, lobbyId: string): boolean => {
  const lobby = getLobby(lobbyId);
  if (lobby.isUserLastMember(userId) === true) {
    return true;
  }
  return false;
};

export default isUserLastMember;
