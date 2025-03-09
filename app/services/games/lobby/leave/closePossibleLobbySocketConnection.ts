import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";
import { Lobby } from "../Lobby";

function closePossibleLobbySocketConnection(userId: string, lobbyId: string): void {
  const privateLobby = PrivateLobbies.get(lobbyId);
  const publicLobby = PublicLobbies.get(lobbyId);

  if (privateLobby !== undefined
      && isUserConnectedToLobbySocket(userId, privateLobby!) === true) {
    privateLobby.disconnectMember(userId);
  }
  else if (publicLobby !== undefined
           && isUserConnectedToLobbySocket(userId, publicLobby!) === true) {
    publicLobby.disconnectMember(userId);
  }
}


function isUserConnectedToLobbySocket(userId: string, lobby: Lobby): boolean {
  if (lobby.memberStatus(userId) === "inLobby") {
    return true;
  }
  else if (lobby.memberStatus(userId) === "inMatch") {
    throw new Error("User can't leave lobby while in match");
  }
  return false;
}

export default closePossibleLobbySocketConnection;
