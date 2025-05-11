import { tournaments } from "../tournaments";

const isMemberInAnyTournament = (memberId: string): string | null => {
  for (const tournament of tournaments.values()) {
    if (tournament.isMemberInTournament(memberId) === true) {
      return tournament.tournamentId;
    }
  }
  return null;
};

export default isMemberInAnyTournament;
