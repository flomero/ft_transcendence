import { FastifyInstance } from "fastify";
import { User } from "../user";

export async function getBlockedUsers(
  fastify: FastifyInstance,
  userId: string,
): Promise<User[]> {
  const sql =
    "SELECT users.id, users.username, users.image_id FROM blocked_users JOIN users ON blocked_users.blockedUserId = users.id WHERE blocked_users.userId = ?";

  return fastify.sqlite.all(sql, [userId]);
}

export async function blockUser(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  const sql = "INSERT INTO blocked_users (userId, blockedUserId) VALUES (?, ?)";

  return fastify.sqlite.run(sql, [userId, blockedUserId]);
}

export async function unblockUser(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  const sql =
    "DELETE FROM blocked_users WHERE userId = ? AND blockedUserId = ?";

  return fastify.sqlite.run(sql, [userId, blockedUserId]);
}

export async function isBlocked(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  const sql =
    "SELECT 1 FROM blocked_users WHERE userId = ? AND blockedUserId = ?";

  const result = await fastify.sqlite.get(sql, [userId, blockedUserId]);

  return result !== null && result !== undefined;
}
