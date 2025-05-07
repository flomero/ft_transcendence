import { PublicLobbies, PrivateLobbies } from "../new/newLobbyHandler";
import type { Lobby } from "../Lobby";
import { getUserById } from "../../../database/user";
import type { FastifyInstance } from "fastify";
import type { User } from "../../../database/user";
import type { LobbyMember } from "../../../../types/games/lobby/LobbyMember";

async function getLobbyById(
  fastify: FastifyInstance,
  lobbyId: string,
  expand = false,
): Promise<
  | (Lobby & {
      ownerName?: string;
      members?: Array<LobbyMember & User>;
    })
  | null
> {
  let isPrivate = false;
  let lobby = PublicLobbies.get(lobbyId);
  if (!lobby) {
    lobby = PrivateLobbies.get(lobbyId);
    isPrivate = true;
  }
  if (!lobby) return null;
  if (!expand) return lobby;
  const owner = await getUserById(fastify, lobby.lobbyOwner);
  const members = await Promise.all(
    Array.from(lobby.getMemberAsArray().values()).map(async (member) => {
      const user = await getUserById(fastify, member.id);
      return {
        ...member,
        ...user,
      };
    }),
  );
  const result = {
    ...lobby,
    ownerName: owner ? owner.username : "Unknown User",
    isPrivate,
    members,
  } as unknown as Lobby & {
    ownerName: string;
    isPrivate: boolean;
    members: Array<LobbyMember & User>;
  };

  return result;
}

export default getLobbyById;
export { getLobbyById };
