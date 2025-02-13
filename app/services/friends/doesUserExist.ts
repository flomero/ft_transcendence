import fastify from 'fastify';

export async function doesUserExist(userId: string): Promise<boolean> {
	const sql = 'SELECT * FROM users WHERE id = $1';
	const user = await fastify.db.get(sql, [userId]);

	if (user === undefined)
		return false;
	return true;
}