import { PublicLobbies } from "../new/newLobbyHandler";
import type { Lobby } from "../Lobby";
import { getUserById } from "../../../database/user";
import type { FastifyInstance } from "fastify";

async function getPublicLobbies(
  fastify: FastifyInstance,
): Promise<Array<Lobby & { ownerName: string }>> {
  let lobbies = Array.from(PublicLobbies.values());
  lobbies = lobbies.filter((lobby) => !lobby.isLobbyLocked);
  lobbies = lobbies.filter((lobby) => lobby.lobbyState === "open");
  if (lobbies.length === 0) return [];
  const lobbiesWithOwnerNames = await Promise.all(
    lobbies.map(async (lobby) => {
      const owner = await getUserById(fastify, lobby.lobbyOwner);
      return {
        ...lobby,
        ownerName: owner ? owner.username : "Unknown User",
      } as Lobby & { ownerName: string };
    }),
  );

  return lobbiesWithOwnerNames;
}

export default getPublicLobbies;
