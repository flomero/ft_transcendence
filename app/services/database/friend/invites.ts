import { FastifyInstance } from "fastify";

export async function getInvites(fastify: FastifyInstance, userId: string) {
  const sql =
    "SELECT * FROM users_friends WHERE receiverId = ? AND accepted = 0";

  return await fastify.sqlite.all(sql, [userId]);
}

export async function getInvitesWithUserInfo(
  fastify: FastifyInstance,
  userId: string,
) {
  const sql =
    "SELECT users_friends.receiverId, users.username, users.image_id FROM users_friends JOIN users ON users_friends.receiverId = users.id WHERE senderId = ? AND accepted = 0";

  return await fastify.sqlite.all(sql, userId);
}

export async function hasInvite(
  fastify: FastifyInstance,
  senderId: string,
  receiverId: string,
) {
  const sql =
    "SELECT 1 FROM users_friends WHERE senderId = ? AND receiverId = ? AND accepted = 0 LIMIT 1";

  const result = await fastify.sqlite.get(sql, [senderId, receiverId]);
  return result !== null && result !== undefined;
}

export async function createInvite(
  fastify: FastifyInstance,
  senderId: string,
  receiverId: string,
) {
  const sql = "INSERT INTO users_friends (senderId, receiverId) VALUES (?, ?)";

  return await fastify.sqlite.run(sql, [senderId, receiverId]);
}

export async function acceptInvite(
  fastify: FastifyInstance,
  senderId: string,
  receiverId: string,
) {
  const sql =
    "UPDATE users_friends SET accepted = 1 WHERE senderId = ? AND receiverId = ?";

  return await fastify.sqlite.run(sql, [senderId, receiverId]);
}
