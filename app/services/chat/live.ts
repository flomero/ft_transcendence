import type { FastifyInstance, FastifyRequest } from "fastify";
import { saveMessage } from "../database/chat/message";
import {
  addUserToChatRoom,
  createChatRoom,
  deleteChatRoom,
  getChatRoomRead,
  getUserIdsFromDirectChatRooms,
  type RoomType,
  setRoomRead,
  setRoomReadForAllUsersBlacklist,
} from "../database/chat/room";
import { ChatMessageType } from "./message";

interface ChatClient {
  socket: any;
  userId: string;
  currentRoomId: number;
  roomIds: number[];
}

const chatClients: ChatClient[] = [];

export function addChatClient(fastify: FastifyInstance, client: ChatClient) {
  chatClients.push(client);

  updateOnlineStatus(fastify, client.userId);
}

export function removeChatClient(fastify: FastifyInstance, userId: string) {
  chatClients.splice(
    chatClients.findIndex((client) => client.userId === userId),
    1,
  );

  updateOnlineStatus(fastify, userId);
}

async function updateOnlineStatus(fastify: FastifyInstance, userId: string) {
  const userIdsAndRoomIds = await getUserIdsFromDirectChatRooms(
    fastify,
    userId,
  );

  for (const { userId, roomId } of userIdsAndRoomIds) {
    sendRoomUpdate(fastify, roomId, userId);
  }
}

interface ChatWebSocketResponse {
  type: "message" | "room";
  id: string;
  html: string;
}

async function createChatRoomWebSocketResponse(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
) {
  const dbRoom = await getChatRoomRead(fastify, roomId, userId);

  const html = await fastify.view("components/chat/room", {
    room: dbRoom,
  });

  const response: ChatWebSocketResponse = {
    type: "room",
    id: roomId.toString(),
    html: html,
  };

  return response;
}

async function sendRoomUpdate(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
) {
  const client = chatClients.find((client) => client.userId === userId);
  if (!client) {
    return;
  }

  if (roomId == -1) {
    return;
  }

  const response = await createChatRoomWebSocketResponse(
    fastify,
    roomId,
    userId,
  );

  client.socket.send(JSON.stringify(response));
}

export async function setCurrentRoomId(
  fastify: FastifyInstance,
  userId: string,
  roomId: number,
) {
  const client = chatClients.find((client) => client.userId === userId);
  if (!client) {
    return;
  }
  client.currentRoomId = roomId;

  await setRoomRead(fastify, true, roomId, userId);
  sendRoomUpdate(fastify, roomId, userId);
}

async function updateRoomAndSendMessage(
  fastify: FastifyInstance,
  userName: string,
  userId: string,
  message: string,
  roomId: number,
  type: ChatMessageType,
) {
  for (const client of chatClients) {
    if (client.currentRoomId != roomId) {
      let room = client.roomIds.find((id) => id == roomId);
      if (!room) {
        continue;
      }

      const dbRoom = await getChatRoomRead(fastify, roomId, client.userId);

      const html = await fastify.view("components/chat/room", {
        room: dbRoom,
      });

      const response: ChatWebSocketResponse = {
        type: "room",
        id: roomId.toString(),
        html: html,
      };

      client.socket.send(JSON.stringify(response));
      continue;
    }

    const html = await fastify.view("components/chat/message", {
      message: {
        userName: userName,
        message: message,
        timestamp: new Date().toLocaleString(),
        isOwnMessage: client.userId === userId,
        type: type,
      },
    });

    const response: ChatWebSocketResponse = {
      type: "message",
      id: roomId.toString(),
      html: html,
    };

    client.socket.send(JSON.stringify(response));
  }

  saveMessage(fastify, roomId, userId, message, type);
}

export async function sendMessage(
  fastify: FastifyInstance,
  request: FastifyRequest,
  message: string,
  roomId: number,
  type: ChatMessageType = ChatMessageType.text,
) {
  const userIdsBlacklist = chatClients
    .filter((client) => client.currentRoomId === roomId)
    .map((client) => client.userId);

  await setRoomReadForAllUsersBlacklist(
    fastify,
    false,
    roomId,
    userIdsBlacklist,
  );

  await updateRoomAndSendMessage(
    fastify,
    request.userName,
    request.userId,
    message,
    roomId,
    type,
  );
}

export async function sendSystemMessage(
  fastify: FastifyInstance,
  roomId: number,
  message: string,
) {
  await updateRoomAndSendMessage(
    fastify,
    "System",
    "system",
    message,
    roomId,
    ChatMessageType.system,
  );
}

export async function sendGameInvite(
  fastify: FastifyInstance,
  roomId: number,
  gameId: number,
) {
  const message: string = "/games/lobby/join/" + gameId;

  await updateRoomAndSendMessage(
    fastify,
    "System",
    "system",
    message,
    roomId,
    ChatMessageType.invite,
  );
}

export async function addRoom(
  fastify: FastifyInstance,
  roomName: string,
  roomType: RoomType,
  userIds: string[],
) {
  const roomId = await createChatRoom(fastify, roomName, roomType);
  for (const userId of userIds) {
    await addUserToChatRoom(fastify, roomId, userId);

    const client = chatClients.find((client) => client.userId === userId);
    if (client) {
      client.roomIds.push(roomId);
    }
  }

  for (const client of chatClients) {
    if (!userIds.includes(client.userId)) {
      continue;
    }

    const response = await createChatRoomWebSocketResponse(
      fastify,
      roomId,
      client.userId,
    );

    client.socket.send(JSON.stringify(response));
  }
}

export function deleteRoom(fastify: FastifyInstance, roomId: number) {
  deleteChatRoom(fastify, roomId);

  for (const client of chatClients) {
    if (client.currentRoomId === roomId) {
      client.currentRoomId = -1;
    }

    const response: ChatWebSocketResponse = {
      type: "room",
      id: roomId.toString(),
      html: "",
    };

    client.socket.send(JSON.stringify(response));
  }
}

export function userIsOnline(userId: string) {
  const client = chatClients.find((client) => client.userId === userId);
  return client !== undefined;
}
