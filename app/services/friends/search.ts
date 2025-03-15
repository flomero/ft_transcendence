import type { FastifyInstance } from "fastify";
import { searchUsersDB } from "../database/friend/search";

export interface UserInviteSearch {
  userId: string;
  userName: string;
  imageUrl: string;
  accepted: boolean;
}

export async function searchUsers(
  fastify: FastifyInstance,
  userId: string,
  username: string,
): Promise<UserInviteSearch[]> {
  const users = await searchUsersDB(fastify, userId, username);

  return users.map((user) => ({
    userId: user.id,
    userName: user.username,
    imageUrl: `/image/${user.image_id}`,
    accepted: user.accepted,
  }));
}
