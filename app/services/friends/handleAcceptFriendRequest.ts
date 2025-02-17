import { FastifyRequest, FastifyReply} from 'fastify';
import { isFriend } from './isFriend';
import { isOpenFriendRequest } from './isOpenFriendRequest';
import { FriendRequestBody } from '../../types/friends/friendRequestBody';
import { FriendRequestContent } from '../../types/friends/friendRequestContent';
import { acceptFriendRequest } from './acceptFriendRequest';


async function handleAcceptFriendRequest(request: FastifyRequest<{Body: FriendRequestBody }>, reply: FastifyReply): Promise<void> {
	const friendId = request.body['X-friendId'];
	const friendRequestContent: FriendRequestContent = {friendId, userId: request.userId, request, reply };

	if (await validUserInfo(friendRequestContent) === false)
		return;
	try {
		await acceptFriendRequest(friendId, request.userId, request.server);
	}
	catch (error) {
		reply.status(500).send("ERROR MESSAGE: " + error );
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