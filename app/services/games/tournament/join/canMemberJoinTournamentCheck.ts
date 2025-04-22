import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { matchMakingManager } from "../../matchMaking/join/joinMatchMakingHandler";
import isMemberInAnyTournament from "../tournamentValidation/isMemberInAnyTournament";

const canMemberJoinTournamentCheck = (
  memberId: string,
  tournamentId: string,
): void => {
  if (isUserInAnyLobby(memberId) !== null) {
    throw new Error("User is already in a lobby");
  }
  const userTournamentId = isMemberInAnyTournament(memberId);
  if (userTournamentId !== null && userTournamentId !== tournamentId) {
    throw new Error("User is already in a tournament: " + userTournamentId);
  }
  if (matchMakingManager.memberExists(memberId) === true) {
    throw new Error("User is already in match making");
  }
};

export default canMemberJoinTournamentCheck;
