import { FastifyInstance, FastifyRequest } from "fastify";
import { saveMessage } from "../database/chat/message";
import {
  addUserToChatRoom,
  createChatRoom,
  deleteChatRoom,
  getChatRoomRead,
  RoomType,
  setRoomRead,
  setRoomReadForAllUsersBlacklist,
} from "../database/chat/room";

interface ChatClient {
  socket: any;
  userId: string;
  currentRoomId: number;
  roomIds: number[];
}

const chatClients: ChatClient[] = [];

export function addChatClient(client: ChatClient) {
  chatClients.push(client);
}

export function removeChatClient(userId: string) {
  chatClients.splice(
    chatClients.findIndex((client) => client.userId === userId),
    1,
  );
}

interface ChatWebSocketResponse {
  type: "message" | "room";
  id: number;
  html: string;
}

export async function sendRoomUpdate(
  fastify: FastifyInstance,
  selected: boolean,
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

  const dbRoom = await getChatRoomRead(fastify, roomId, userId);

  const html = await fastify.view("components/chat/room", {
    room: {
      id: roomId,
      name: dbRoom.name,
      read: dbRoom.read,
      selected: selected,
    },
  });

  const response: ChatWebSocketResponse = {
    type: "room",
    id: roomId,
    html: html,
  };

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

  await sendRoomUpdate(fastify, false, client.currentRoomId, userId);

  client.currentRoomId = roomId;

  await setRoomRead(fastify, true, roomId, userId);
  await sendRoomUpdate(fastify, true, roomId, userId);
}

export async function sendMessage(
  fastify: FastifyInstance,
  request: FastifyRequest,
  message: string,
  roomId: number,
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

  for (const client of chatClients) {
    if (client.currentRoomId !== roomId) {
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
        id: roomId,
        html: html,
      };

      client.socket.send(JSON.stringify(response));

      continue;
    }

    const html = await fastify.view("components/chat/message", {
      message: {
        userName: request.userName,
        message: message,
        timestamp: new Date().toLocaleString(),
        isOwnMessage: client.userId === request.userId,
      },
    });

    const response: ChatWebSocketResponse = {
      type: "message",
      id: roomId,
      html: html,
    };

    client.socket.send(JSON.stringify(response));
  }

  await saveMessage(fastify, roomId, request.userId, message);
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

    const html = await fastify.view("components/chat/room", {
      room: {
        id: roomId,
        name: roomName,
        read: false,
      },
    });

    const response: ChatWebSocketResponse = {
      type: "room",
      id: roomId,
      html: html,
    };

    client.socket.send(JSON.stringify(response));
  }
}

export async function deleteRoom(fastify: FastifyInstance, roomId: number) {
  await deleteChatRoom(fastify, roomId);

  for (const client of chatClients) {
    if (client.currentRoomId === roomId) {
      client.currentRoomId = -1;
    }

    const response: ChatWebSocketResponse = {
      type: "room",
      id: roomId,
      html: "",
    };

    client.socket.send(JSON.stringify(response));
  }
}

export function userIsOnline(userId: string) {
  const client = chatClients.find((client) => client.userId === userId);
  return client !== undefined;
}
