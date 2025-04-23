import { tournaments } from "../../../../services/games/tournament/new/newTournamentHandler";

const canTournamentBeLeftCheck = (memberId: string, tournamentId: string) => {
  if (tournaments.get(tournamentId) === undefined) {
    throw new Error("Tournament does not exist");
  }
  if (tournaments.get(tournamentId)?.isMemberInTournament(memberId) === false) {
    throw new Error("Member is not in the tournament: " + tournamentId);
  }
};

export default canTournamentBeLeftCheck;
