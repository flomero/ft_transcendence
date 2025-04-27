import type { FastifyInstance } from "fastify";
import { userToUserWithImage, type UserWithImage } from "../user";

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
  const sql = `SELECT
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
    WHERE r_users_chat.user_id = ? AND chat_rooms.id = ?;`;
  const result = await fastify.sqlite.get(sql, [userId, userId, roomId]);
  if (!result) {
    throw new Error("Chat room not found");
  }

  return {
    id: result.id,
    name: result.name,
    type: result.type,
    read: result.read,
    user: result["user.id"]
      ? userToUserWithImage({
          id: result["user.id"],
          username: result["user.username"],
          image_id: result["user.image_id"],
        })
      : undefined,
  };
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
    fastify.log.error("Error deleting chat room", error);
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

  function mapRowToChatRoom(row: any): ChatRoom {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      read: row.read,
      user: row["user.id"]
        ? userToUserWithImage({
            id: row["user.id"],
            username: row["user.username"],
            image_id: row["user.image_id"],
          })
        : undefined,
    };
  }

  return results.map(mapRowToChatRoom);
}

export async function getUserIdsFromDirectChatRooms(
  fastify: FastifyInstance,
  userId: string,
): Promise<{ userId: string; roomId: number }[]> {
  const sql = `SELECT user_id, room_id FROM r_users_chat WHERE room_id IN (SELECT room_id FROM r_users_chat WHERE user_id = ?) AND user_id != ?;`;

  const result = await fastify.sqlite.all(sql, [userId, userId]);
  return result.map((row) => ({ userId: row.user_id, roomId: row.room_id }));
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
