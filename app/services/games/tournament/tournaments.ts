import { FastifyInstance } from "fastify";
import { getUserById, User } from "../../database/user";
import TournamentManager from "./TournamentManager";
import { TournamentStatus } from "./tournament";

export const tournaments = new Map<string, TournamentManager>();

export function getTournaments() {
  let managerList = Array.from(tournaments.values());
  managerList = managerList.filter(
    (manager) =>
      manager.getTournamentStatus() === TournamentStatus.CREATED &&
      !manager.isTournamentFull(),
  );

  managerList = managerList.filter((manager) => manager.tournamentSize > 0);
  return managerList;
}

export async function getTournamentsWithOwners(
  fastify: FastifyInstance,
): Promise<(TournamentManager & { owner: User | undefined })[]> {
  const tournamentsWithOwners = await Promise.all(
    Array.from(tournaments.values()).map(async (manager) => {
      return Object.assign(manager, {
        owner: await getUserById(fastify, manager.ownerId),
      });
    }),
  );

  return tournamentsWithOwners;
}
