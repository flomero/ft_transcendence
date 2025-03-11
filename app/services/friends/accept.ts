import { isFriend } from "../database/friend/isFriend";
import { isOpenFriendRequest } from "../database/friend/isOpenFriendRequest";
import { FriendRequestContent } from "../../types/friends/friendRequestContent";

export async function validUserInfo(
  content: FriendRequestContent,
): Promise<boolean> {
  if (
    await isFriend(
      content.friendId,
      content.request.userId,
      content.request.server,
    )
  ) {
    content.reply.status(400).send({ message: "User is already a friend" });
    return false;
  } else if (
    !(await isOpenFriendRequest(
      content.friendId,
      content.request.userId,
      content.request.server,
    ))
  ) {
    content.reply.status(400).send({ message: "No friend request found" });
    return false;
  }
  return true;
}
