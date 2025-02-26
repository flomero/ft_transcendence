import { FastifyRequest, FastifyReply} from 'fastify';
import { doesUserExist } from './doesUserExist';
import { saveFriendRequest } from './saveFriendRequest';
import { isFriend } from './isFriend';
import { FriendRequestBody } from '../../types/friends/friendRequestBody';
import { FriendRequestContent } from '../../types/friends/friendRequestContent';

export async function handleSendFriendRequest(request: FastifyRequest<{ Body: FriendRequestBody }>, reply: FastifyReply): Promise<void> {
	const friendId = request.body['X-friendId'];
	const friendRequestContent: FriendRequestContent = {friendId, userId: request.userId, request, reply };

	if (await validUserInfo(friendRequestContent) === false)
		return;

	try {
		await saveFriendRequest(friendId, request.userId, request.server);
	}
	catch (error) {
		reply.status(500).send({ message: 'Failed to save friend request' });
		return;
	}

	reply.status(200).send({ message: 'Request sent' });
}

async function validUserInfo(content: FriendRequestContent): Promise<boolean> {

	if (await doesUserExist(content.friendId, content.request.server) === false) {
		content.reply.status(404).send({ message: 'User not found' });
		return false;
	}
	else if (await isFriend(content.friendId, content.userId, content.request.server) === true) {
		content.reply.status(400).send({ message: 'User is already a friend' });
		return false;
	}
	return true;
}

export default handleSendFriendRequest;