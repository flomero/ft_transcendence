import { tournaments } from "../new/newTournamentHandler";

const validTournamentConnectionCheck = (
  memberId: string,
  tournamentId: string,
) => {
  if (tournaments.has(tournamentId) === false) {
    throw new Error(
      "[validTournamentConnectionCheck] Tournament does not exist",
    );
  }
  if (tournaments.get(tournamentId)?.isMemberInTournament(memberId) === false) {
    throw new Error("You are not a member of this tournament");
  }
};

export default validTournamentConnectionCheck;
