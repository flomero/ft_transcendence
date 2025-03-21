import { FastifyInstance } from "fastify";
import { UserWithImage } from "../user";

export interface ChatRoom {
  id: number;
  name: string;
  read: boolean;
  type: RoomType;
  user?: UserWithImage;
}

export enum RoomType {
  Direct = "DIRECT",
  Game = "GAME",
}

export async function getChatRoomRead(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
): Promise<ChatRoom> {
  const sql =
    "SELECT chat_rooms.id, chat_rooms.name, r_users_chat.read FROM chat_rooms JOIN r_users_chat ON chat_rooms.id = r_users_chat.room_id WHERE r_users_chat.user_id = ? AND chat_rooms.id = ?";
  const result = await fastify.sqlite.get(sql, [userId, roomId]);
  if (!result) {
    throw new Error("Chat room not found");
  }
  return result;
}

export async function createChatRoom(
  fastify: FastifyInstance,
  name: string,
  type: RoomType,
): Promise<number> {
  const sql = "INSERT INTO chat_rooms (name, type) VALUES (?, ?) RETURNING id";
  const result = await fastify.sqlite.get(sql, [name, type]);
  fastify.log.trace(`Created chat_room with id: ${result.id}`);
  return result.id;
}

export async function deleteChatRoom(fastify: FastifyInstance, roomId: number) {
  try {
    await fastify.sqlite.run("DELETE FROM chat_rooms WHERE id = ?;", [roomId]);
  } catch (error) {
    fastify.log.error(error);
  }
}

export async function addUserToChatRoom(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
) {
  const sql = "INSERT INTO r_users_chat (room_id, user_id) VALUES (?, ?)";
  await fastify.sqlite.run(sql, [roomId, userId]);
}

export async function getChatRoomsForUser(
  fastify: FastifyInstance,
  userId: string,
): Promise<ChatRoom[]> {
  const sql = `
    SELECT 
      chat_rooms.id, 
      chat_rooms.name, 
      chat_rooms.type, 
      r_users_chat.read,
      users.id as "user.id",
      users.username as "user.username",
      users.image_id as "user.image_id"
    FROM chat_rooms 
    JOIN r_users_chat ON chat_rooms.id = r_users_chat.room_id 
    LEFT JOIN r_users_chat other_users ON chat_rooms.id = other_users.room_id 
      AND other_users.user_id != ? AND chat_rooms.type = 'DIRECT'
    LEFT JOIN users ON other_users.user_id = users.id
    WHERE r_users_chat.user_id = ?`;

  const results = await fastify.sqlite.all(sql, [userId, userId]);

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    read: row.read,
    user: row["user.id"]
      ? {
          userId: row["user.id"],
          userName: row["user.username"],
          imageUrl: `/image/${row["user.image_id"]}`,
        }
      : undefined,
  }));
}

export async function getChatRoomTwoUsers(
  fastify: FastifyInstance,
  userId1: string,
  userId2: string,
) {
  const sql = `SELECT room_id
FROM r_users_chat
WHERE user_id IN (?, ?)
GROUP BY room_id
HAVING COUNT(DISTINCT user_id) = 2;`;

  const result = await fastify.sqlite.get(sql, [userId1, userId2]);

  fastify.log.info(`Result: ${JSON.stringify(result)}`);
  return result?.room_id;
}

export async function setRoomRead(
  fastify: FastifyInstance,
  read: boolean,
  roomId: number,
  userId: string,
) {
  const sql =
    "UPDATE r_users_chat SET read = ? WHERE room_id = ? AND user_id = ?";
  await fastify.sqlite.run(sql, [read, roomId, userId]);
}

export async function setRoomReadForAllUsersBlacklist(
  fastify: FastifyInstance,
  read: boolean,
  roomId: number,
  userIdsBlacklist: string[],
) {
  if (userIdsBlacklist.length === 0) {
    const sql = "UPDATE r_users_chat SET read = ? WHERE room_id = ?";
    await fastify.sqlite.run(sql, [read, roomId]);
    return;
  }

  const placeholders = userIdsBlacklist.map(() => "?").join(",");
  const sql = `UPDATE r_users_chat SET read = ? WHERE room_id = ? AND user_id NOT IN (${placeholders})`;
  await fastify.sqlite.run(sql, [read, roomId, ...userIdsBlacklist]);
}

export async function userIsInRoom(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
): Promise<boolean> {
  const sql =
    "SELECT 1 FROM r_users_chat WHERE room_id = ? AND user_id = ? LIMIT 1";
  const result = await fastify.sqlite.get(sql, [roomId, userId]);
  return result !== null && result !== undefined;
}
