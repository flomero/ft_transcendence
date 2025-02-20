import { FastifyInstance } from 'fastify';

export async function saveFriendRequest(friendId: string, userId: string, fastify: FastifyInstance): Promise<void> {
	const sql =  `
    INSERT INTO users_friends (senderId, receiverId, accepted)
    VALUES ($1, $2, $3)`
    ;
	const ret = await fastify.sqlite.run(sql, [userId, friendId, 0]);
	if (ret === undefined)
		throw new Error('Failed to save friend request');
}
