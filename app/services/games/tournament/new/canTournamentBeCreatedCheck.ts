import { isUserInAnyLobby } from "../../lobby/lobbyVaidation/isUserInAnyLobby";
import { matchMakingManager } from "../../matchMaking/MatchMakingManager";
import isMemberInAnyTournament from "../tournamentValidation/isMemberInAnyTournament";
import { GameModeType } from "../../../config/gameModes";
import { TOURNAMENT_CONFIGS_REGISTRY } from "../../../../config";

const canTournamentBeCreatedCheck = (
  memberId: string,
  gameMode: GameModeType | null,
  tournamentSize: number,
  tournamentConfigKey: string | number | null,
): void => {
  if (isUserInAnyLobby(memberId) !== null) {
    throw new Error("User is already in a lobby");
  }
  if (isMemberInAnyTournament(memberId) !== null) {
    throw new Error(
      "User is already in a tournament: " + isMemberInAnyTournament(memberId),
    );
  }
  if (matchMakingManager.memberExists(memberId) === true) {
    throw new Error("User is already in match making");
  }
  if (gameMode === null || tournamentConfigKey === null)
    throw new Error("Game mode or tournament config not found");
  if (
    TOURNAMENT_CONFIGS_REGISTRY[
      tournamentConfigKey
    ].possiblePlayerCount.includes(tournamentSize) === false
  )
    throw new Error("Tournament size invalid");
};

export default canTournamentBeCreatedCheck;
