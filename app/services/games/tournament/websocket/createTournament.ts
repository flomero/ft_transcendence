import { Database } from "sqlite3";
import { Tournament } from "../tournament";
import TournamentManager from "../TournamentManager";
import {
  bracketTypeSettings,
  TournamentSettings,
} from "../../../../interfaces/games/tournament/TournamentSettings";
import {
  TOURNAMENT_CONFIGS_REGISTRY,
  GAMEMODE_REGISTRY,
} from "../../../../config";

const createTournament = async (
  db: Database,
  tournamentManager: TournamentManager,
) => {
  const tournamentConfigKey = tournamentManager.getTournamentConfigKey();
  const tournamentRegistry = TOURNAMENT_CONFIGS_REGISTRY[tournamentConfigKey];
  const playerCount =
    GAMEMODE_REGISTRY[tournamentManager.getGameModeType()].playerCount;
  const playersUUIDs = tournamentManager.getPlayersUUIDs();

  const tournamentSettings: TournamentSettings = {
    bracketType: tournamentRegistry.bracketType as bracketTypeSettings,
    matchWinner: tournamentRegistry.matchWinner,
    players: playersUUIDs,
    gameData: {
      playerCount: playerCount,
    },
  };

  const newTournament = new Tournament(tournamentSettings);
  addTournamentToDB(db, tournamentManager);

  return newTournament;
};

const addTournamentToDB = async (
  db: Database,
  tournamentManager: TournamentManager,
) => {
  const tournamentStatus = tournamentManager.getTournamentStatus();
  const tournamentId = tournamentManager.getId();
  const gameMode = tournamentManager.getGameModeType();

  try {
    db.run(
      `
           INSERT INTO tournaments
           (id, status, mode)
           VALUES (?, ?, ?)`,
      [tournamentId, tournamentStatus, gameMode],
    );
  } catch (error) {
    console.error("Error adding tournament to DB:", error);
  }
};

export default createTournament;
