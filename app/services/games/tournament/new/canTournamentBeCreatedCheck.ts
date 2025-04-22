import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { tournaments } from "./newTournamentHandler";
import { matchMakingManager } from "../../matchMaking/join/joinMatchMakingHandler";

const canTournamentBeCreatedCheck = (memberId: string): void => {
  if (isUserInAnyLobby(memberId) !== null) {
    throw new Error("User is already in a lobby");
  }
  if (tournaments.has(memberId) === true) {
    throw new Error("User is already in a tournament");
  }
  if (matchMakingManager.memberExists(memberId) === true) {
    throw new Error("User is already in match making");
  }
};

export default canTournamentBeCreatedCheck;
