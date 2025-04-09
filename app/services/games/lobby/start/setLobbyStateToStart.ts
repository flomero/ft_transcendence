import { getLobby } from "../lobbyWebsocket/getLobby";

function setLobbyStateToStart(ownerId: string, lobbId: string): void {
  const lobby = getLobby(lobbId);
  lobby.changeState(ownerId, "started");
}

export default setLobbyStateToStart;
