import { FastifyInstance } from 'fastify';

export async function saveFriendRequest(friendId: string, userId: string, statusAcceppted: number, fastify: FastifyInstance): Promise<void> {
	const sql = 'INSERT INTO users_friends (senderId, receiverId, accepted) VALUES ($1, $2, $3)';
	const ret = await fastify.sqlite.run(sql, [userId, friendId, statusAcceppted]);
	if (ret === undefined)
		throw new Error('Failed to save friend request');
}