import { FastifyRequest, FastifyReply} from 'fastify';
import { isFriend } from './isFriend';
import { isOpenFriendRequest } from './isOpenFriendRequest';
import { saveFriendRequest } from './saveFriendRequest';
import { FriendRequestBody } from '../../types/friends/friendRequestBody';
import { FriendRequestContent } from '../../types/friends/friendRequestContent';


async function handleAcceptFriendRequest(request: FastifyRequest<{Body: FriendRequestBody }>, reply: FastifyReply): Promise<void> {
	const friendId = request.body['X-friendId'];
	const friendRequestContent: FriendRequestContent = {friendId, userId: request.userId, request, reply };

	if (await validUserInfo(friendRequestContent) === false)
		return;
	try {
		await saveFriendRequest(friendId, request.userId, 1, request.server);
	}
	catch (error) {
		reply.status(500).send({ message: 'Failed to accept friend request' });
		return;
	}

	reply.status(200).send({ message: 'Request accepted' });
}

async function validUserInfo(content: FriendRequestContent): Promise<boolean> {
	if (await isFriend(content.friendId, content.request.userId, content.request.server) === true) {
		content.reply.status(400).send({ message: 'User is already a friend' });
		return false;
	}
	else if (await isOpenFriendRequest(content.friendId, content.request.userId, content.request.server) === false) {
		content.reply.status(400).send({ message: 'No friend request found' });
		return false;
	}
	return true;
}

export default handleAcceptFriendRequest;