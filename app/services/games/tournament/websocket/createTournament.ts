import type { Database } from "sqlite";
import { Tournament } from "../tournament";
import type TournamentManager from "../TournamentManager";
import {
  BracketTypeSettings,
  TournamentSettings,
} from "../../../../interfaces/games/tournament/TournamentSettings";
import {
  TOURNAMENT_CONFIGS_REGISTRY,
  GAMEMODE_REGISTRY,
} from "../../../../config";
import { fastifyInstance } from "../../../../app";

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
    bracketType: tournamentRegistry.bracketType as BracketTypeSettings,
    matchWinner: tournamentRegistry.matchWinner,
    players: playersUUIDs,
    gameData: {
      playerCount: playerCount,
    },
    id: tournamentManager.getId(),
  };

  fastifyInstance.log.debug(JSON.stringify(tournamentSettings));
  const newTournament = new Tournament(tournamentSettings);
  await addTournamentToDB(db, tournamentManager, newTournament);

  return newTournament;
};

const addTournamentToDB = async (
  db: Database,
  tournamentManager: TournamentManager,
  tournament: Tournament,
) => {
  const tournamentStatus = tournament.getStatus();
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
