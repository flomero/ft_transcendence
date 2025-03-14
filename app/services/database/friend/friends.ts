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

export async function isFriend(
  fastify: FastifyInstance,
  senderId: string,
  receiverId: string,
) {
  const sql =
    "SELECT 1 FROM users_friends WHERE senderId = ? AND receiverId = ? AND accepted = 1";

  const result = await fastify.sqlite.get(sql, [senderId, receiverId]);

  return result !== null && result !== undefined;
}

export async function saveFriend(
  fastify: FastifyInstance,
  senderId: string,
  receiverId: string,
) {
  const sql =
    "INSERT INTO users_friends (senderId, receiverId, accepted) VALUES (?, ?, 1)";

  return fastify.sqlite.run(sql, [senderId, receiverId]);
}

export async function deleteFriend(
  fastify: FastifyInstance,
  userId1: string,
  userId2: string,
) {
  const sql =
    "DELETE FROM users_friends WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)";

  return fastify.sqlite.run(sql, [userId1, userId2, userId2, userId1]);
}
