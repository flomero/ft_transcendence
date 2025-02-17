import { FastifyInstance } from 'fastify';

export async function acceptFriendRequest(friendId: string, userId: string, fastify: FastifyInstance): Promise<void> {
	const sql = 'UPDATE users_friends SET accepted = 1 WHERE senderId = ? AND receiverId = ?';
	await fastify.sqlite.run(sql, [friendId, userId]);
}