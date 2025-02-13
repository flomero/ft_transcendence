import fastify from 'fastify';
import { FastifyRequest, FastifyResponse} from 'fastify';
import { isFriend } from './isFriend';
import { isOpenFriendRequest } from './isOpenFriendRequest';

async function handleAcceptFriendRequest(request: FastifyRequest, response: FastifyResponse): Promise<void> {
	const friendId = request.body['X-friendId'];

	if (validUserInfo(friendId, response) === false)
		return;
	try {
		await saveFriendRequest(friendId, 1);
	}
	catch (error) {
		response.status(500).send({ message: 'Failed to accept friend request' });
		return;
	}

	response.status(200).send({ message: 'Request accepted' });
}

async function validUserInfo(friendId: string, response: FastifyResponse): Promise<boolean> {
	if (isFriend(friendId) === true) {
		response.status(400).send({ message: 'User is already a friend' });
		return false;
	}
	else if (isOpenFriendRequest(friendId) === false) {
		response.status(400).send({ message: 'No friend request found' });
		return false;
	}
}