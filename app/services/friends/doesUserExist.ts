import { FastifyInstance } from 'fastify';

export async function doesUserExist(userId: string, fastify: FastifyInstance): Promise<boolean> {
	const sql = `
  SELECT id FROM users
  WHERE id = $1
  `;

	console.log("ID TO CHECK [" + userId + "]");
	const user = await fastify.sqlite.get(sql, [userId]);

	if (user === undefined)
		return false;
	return true;
}
