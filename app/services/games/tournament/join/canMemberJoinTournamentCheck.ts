import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { tournaments } from "../tournaments";
import isMemberInAnyTournament from "../tournamentValidation/isMemberInAnyTournament";
import { matchMakingManager } from "../../matchMaking/MatchMakingManager";
import isUserInGame from "../../gameHandler/isUserInGame";
import { TournamentStatus } from "../tournament";

const canMemberJoinTournamentCheck = (
  memberId: string,
  tournamentId: string,
): void => {
  if (isUserInAnyLobby(memberId) !== null) {
    throw new Error("Member is already in a lobby");
  }
  const userTournamentId = isMemberInAnyTournament(memberId);
  if (userTournamentId !== null && userTournamentId !== tournamentId) {
    throw new Error(`Member is already in a tournament: ${userTournamentId}`);
  }
  if (matchMakingManager.memberExists(memberId) === true) {
    throw new Error("Member is already in matchmaking");
  }
  if (isUserInGame(memberId) !== null) {
    throw new Error("Member is already in a game");
  }

  if (userTournamentId === tournamentId) return;

  const tournament = tournaments.get(tournamentId);
  const tournamentStatus = tournament?.getTournamentStatus();
  console.log("TOURNAMENT STATUS", tournamentStatus);
  if (
    tournamentStatus !== undefined &&
    tournamentStatus !== TournamentStatus.CREATED &&
    userTournamentId === null
  )
    throw new Error("Tournament started already");
};

export default canMemberJoinTournamentCheck;
