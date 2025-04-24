import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { tournaments } from "../new/newTournamentHandler";
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
  const tournament = tournaments.get(tournamentId);
  if (tournament?.isMemberInTournament(memberId) === true) {
    throw new Error("User is already in match making");
  }
};

export default canMemberJoinTournamentCheck;
