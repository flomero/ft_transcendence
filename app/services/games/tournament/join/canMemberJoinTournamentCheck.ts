import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { tournaments } from "../tournaments";
import isMemberInAnyTournament from "../tournamentValidation/isMemberInAnyTournament";
import { matchMakingManager } from "../../matchMaking/MatchMakingManager";
import isUserInGame from "../../gameHandler/isUserInGame";

const canMemberJoinTournamentCheck = (
  memberId: string,
  tournamentId: string,
): void => {
  if (isUserInAnyLobby(memberId) !== null) {
    throw new Error("Member is already in a lobby");
  }
  const tournament = tournaments.get(tournamentId);
  if (tournament?.isMemberInTournament(memberId) === true) {
    throw new Error(
      `Member: ${memberId} is already in the Tournament: ${tournamentId}`,
    );
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
};

export default canMemberJoinTournamentCheck;
