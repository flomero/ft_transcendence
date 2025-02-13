import fastify from 'fastify';
import { FastifyRequest, FastifyResponse} from 'fastify';
import { doesUserExist } from './doesUserExist';
import { saveFriendRequest } from './sendFriendRequest';
import { isFriend } from './isFriend';

export async function handleSendFriendRequest(request: FastifyRequest, response: FastifyResponse): Promise<void> {
	const friendId = request.body['X-friendId'];

	if (await validUserInfo(friendId, response) === false)
		return;

	try {
		await saveFriendRequest(friendId, 0);
	}
	catch (error) {
		response.status(500).send({ message: 'Failed to save friend request' });
		return;
	}

	response.status(200).send({ message: 'Request sent' });
}

async function validUserInfo(friendId: string, response: FastifyResponse): Promise<boolean> {

	if (await doesUserExist(friendId) === false) {
		response.status(404).send({ message: 'User not found' });
		return false;
	}
	else if (await isFriend(friendId) === true) {
		response.status(400).send({ message: 'User is already a friend' });
		return false;
	}
}