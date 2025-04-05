import { PublicLobbies } from "../new/newLobbyHandler";
import { Lobby } from "../Lobby";
import { getUserById } from "../../../database/user";
import { FastifyInstance } from "fastify";

async function getPublicLobbies(
  fastify: FastifyInstance,
): Promise<Array<Lobby & { ownerName: string }>> {
  const lobbies = Array.from(PublicLobbies.values());
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
