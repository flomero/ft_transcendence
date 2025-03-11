import { isFriend } from "../database/friend/isFriend";
import { FriendRequestContent } from "../../types/friends/friendRequestContent";
import { userExists } from "../database/user";

export async function checkFriendRequest(
  content: FriendRequestContent,
): Promise<boolean> {
  if (!(await userExists(content.request.server, content.friendId))) {
    content.reply.status(404).send({ message: "User not found" });
    return false;
  } else if (
    await isFriend(content.friendId, content.userId, content.request.server)
  ) {
    content.reply.status(400).send({ message: "User is already a friend" });
    return false;
  }
  return true;
}
