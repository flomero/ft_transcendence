import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { matchMakingManager } from "../../matchMaking/MatchMakingManager";
import isMemberInAnyTournament from "../tournamentValidation/isMemberInAnyTournament";

const canTournamentBeCreatedCheck = (memberId: string): void => {
  if (isUserInAnyLobby(memberId) !== null) {
    throw new Error("User is already in a lobby");
  }
  if (isMemberInAnyTournament(memberId) !== null) {
    throw new Error("User is already in a tournament");
  }
  if (matchMakingManager.memberExists(memberId) === true) {
    throw new Error("User is already in match making");
  }
};

export default canTournamentBeCreatedCheck;
