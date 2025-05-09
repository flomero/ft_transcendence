import { TOURNAMENT_CONFIGS_REGISTRY } from "../../../config";
import type { Database } from "sqlite";
import type { GameModeType } from "../../config/gameModes";
import TournamentManager from "./TournamentManager";
import { TournamentStatus } from "./tournament";

export const tournaments = new Map<string, TournamentManager>();

export function initializeSampleTournaments(db: Database) {
  const sampleUserIds = Array.from<string>({
    length: Object.values(TOURNAMENT_CONFIGS_REGISTRY).length,
  }).fill("user123");
  // sampleUserIds[0] = "107576203838928819270";

  const tournamentConfigs = Object.values(TOURNAMENT_CONFIGS_REGISTRY)
    .filter((_, index) => index < sampleUserIds.length)
    .map((tournamentConfig) => {
      return {
        tournamentMode: "public",
        ...tournamentConfig,
      };
    });

  tournamentConfigs.forEach((config, index) => {
    const tournament = new TournamentManager(
      Object.keys(TOURNAMENT_CONFIGS_REGISTRY)[index],
      sampleUserIds[index],
      "classicPong" as GameModeType,
      config.possiblePlayerCount[0],
      db,
    );
    tournaments.set(tournament.tournamentId, tournament);
  });
  console.log("Sample tournaments initialized");
}

export function getTournaments() {
  let managerList = Array.from(tournaments.values());
  managerList = managerList.filter(
    (manager) => manager.getTournamentStatus() === TournamentStatus.CREATED,
  );
  managerList = managerList.filter((manager) => manager.tournamentSize > 0);
  return managerList;
}
