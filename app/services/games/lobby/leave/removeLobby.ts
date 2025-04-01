import { PrivateLobbies, PublicLobbies } from "../new/newLobbyHandler";

const removeLobby = (lobbyId: string) => {
  PrivateLobbies.delete(lobbyId);
  PublicLobbies.delete(lobbyId);
};

export default removeLobby;
