import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";

function setLobbyStateToStart(ownerId: string, lobbId: string): void {
  if (PublicLobbies.has(lobbId) === true) {
    PublicLobbies.get(lobbId)!.changeState(ownerId, "started");
  } else if (PrivateLobbies.has(lobbId) === true) {
    PrivateLobbies.get(lobbId)!.changeState(ownerId, "started");
  }
}

export default setLobbyStateToStart;
