import { FastifyInstance } from "fastify";
import { User } from "../user";

export async function getBlockedUsers(
  fastify: FastifyInstance,
  userId: string,
): Promise<User[]> {
  const sql =
    "SELECT users.id, users.username, users.image_id FROM users_blocked JOIN users ON users_blocked.blockedUserId = users.id WHERE users_blocked.userId = ?";

  return fastify.sqlite.all(sql, [userId]);
}

export async function saveBlockedUser(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  const sql = "INSERT INTO users_blocked (userId, blockedUserId) VALUES (?, ?)";

  return await fastify.sqlite.run(sql, [userId, blockedUserId]);
}

export async function deleteBlockedUser(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  const sql =
    "DELETE FROM users_blocked WHERE userId = ? AND blockedUserId = ?";

  return await fastify.sqlite.run(sql, [userId, blockedUserId]);
}

export async function isBlocked(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  const sql =
    "SELECT 1 FROM users_blocked WHERE userId = ? AND blockedUserId = ?";

  const result = await fastify.sqlite.get(sql, [userId, blockedUserId]);

  return result !== null && result !== undefined;
}
