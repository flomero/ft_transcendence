import fastify from 'fastify';

export async function isFriend(friendId: string): Promise<boolean> {
	const sql = 'SELECT accepted FROM users_friends WHERE senderId = $1 AND receiverId = $2';
	const userIsSender = await fastify.db.get(sql, [fastify.userID, friendId]);
	const userIsReceiver = await fastify.db.get(sql, [friendId, fastify.userID]);

	if (userIsSender === undefined || userIsSender.accepted === 0)
		return false;
	else if (userIsReceiver === undefined || userIsReceiver.accepted === 0)
		return false;
	return true;
}