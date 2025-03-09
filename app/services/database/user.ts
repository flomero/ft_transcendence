import { FastifyInstance } from "fastify";

export interface User {
  id: string;
  username: string;
}

export async function insertUserIfNotExists(
  fastify: FastifyInstance,
  user: User,
) {
  const sql = `
    INSERT INTO users (id, username)
    VALUES (?, ?) ON CONFLICT DO NOTHING
    `;
  await fastify.sqlite.run(sql, [user.id, user.username]);
}

export async function updateUsername(
  fastify: FastifyInstance,
  userId: string,
  newUsername: string,
): Promise<boolean> {
  const sql = `
    UPDATE users SET username = ? WHERE id = ?`;
  const result = await fastify.sqlite.run(sql, [newUsername, userId]);
  return (result?.changes ?? 0) > 0;
}
