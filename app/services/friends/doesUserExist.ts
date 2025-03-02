import { FastifyInstance } from 'fastify';

export async function doesUserExist(userId: string, fastify: FastifyInstance): Promise<boolean> {
	const sql = `
  SELECT id FROM users
  WHERE id = $1
  `;
	const dbUserId = await fastify.sqlite.get(sql, [userId]);

  if (dbUserId !== undefined)
    return true;
  return false;
}
