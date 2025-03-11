import { FastifyInstance } from "fastify";

export async function getFriends(fastify: FastifyInstance, userId: string) {
  const sql = "SELECT * FROM users_friends WHERE senderId = $1";

  return fastify.sqlite.all(sql, [userId]);
}

export async function getFriendsWithUserInfo(
  fastify: FastifyInstance,
  userId: string,
) {
  const sql = `
    SELECT users_friends.*, users.username, users.image_id
    FROM users_friends
    JOIN users ON users_friends.receiverId = users.id
    WHERE users_friends.senderId = $1 AND users_friends.accepted = 1
  `;

  return fastify.sqlite.all(sql, [userId]);
}
