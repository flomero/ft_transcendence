import { FastifyInstance } from "fastify";

export interface UserInviteSearchDB {
  id: string;
  username: string;
  image_id: string;
  accepted: boolean;
}

export async function searchUsersDB(
  fastify: FastifyInstance,
  userId: string,
  username: string,
): Promise<UserInviteSearchDB[]> {
  const users = await fastify.sqlite.all(
    "SELECT users.id, users.username, users.image_id, users_friends.accepted FROM users LEFT JOIN users_friends ON users.id = users_friends.receiverId AND users_friends.senderId = ? WHERE users.username LIKE ? LIMIT 10",
    [userId, `%${username}%`],
  );

  return users;
}
