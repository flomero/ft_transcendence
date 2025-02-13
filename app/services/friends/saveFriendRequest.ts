import fastify from 'fastify';

export async function saveFriendRequest(friendId: string, statusAcceppted: number): Promise<void> {
	const sql = 'INSERT INTO users_friends (senderId, receiverId, accepted) VALUES ($1, $2, $3)';
	const ret = await fastify.db.run(sql, [fastify.userID, friendId, statusAcceppted]);
	if (ret === undefined)
		throw new Error('Failed to save friend request');
}