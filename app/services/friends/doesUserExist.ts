import { FastifyInstance } from 'fastify';

export async function doesUserExist(userId: string, fastify: FastifyInstance): Promise<boolean> {
	const sql = 'SELECT * FROM users WHERE id = $1';
	const user = await fastify.sqlite.get(sql, [userId]);

	if (user === undefined)
		return false;
	return true;
}