import type { FastifyInstance } from "fastify";
import type { UUID } from "node:crypto";
import { userIsOnline } from "../chat/live";

export interface User {
  id: string;
  username: string;
  image_id: UUID;
}

export interface UserWithImage {
  userId: string;
  userName: string;
  imageUrl: string;
  online?: boolean;
}

export function userToUserWithImage(user: User): UserWithImage {
  return {
    userId: user.id,
    userName: user.username,
    imageUrl: `/image/${user.image_id}`,
    online: userIsOnline(user.id),
  };
}

export function usersToUserWithImages(users: User[]): UserWithImage[] {
  return users.map(userToUserWithImage);
}

export async function getUserById(
  fastify: FastifyInstance,
  userId: string,
): Promise<User | undefined> {
  const sql = "SELECT * FROM users WHERE id = ?";
  return await fastify.sqlite.get(sql, userId);
}

export async function userExists(
  fastify: FastifyInstance,
  userId: string,
): Promise<boolean> {
  const sql = "SELECT 1 FROM users WHERE id = ? LIMIT 1";
  const result = await fastify.sqlite.get(sql, userId);
  return result !== null && result !== undefined;
}

export async function insertUserIfNotExists(
  fastify: FastifyInstance,
  user: User,
) {
  const sql = `
    INSERT INTO users (id, username, image_id)
    VALUES (?, ?, ?) ON CONFLICT DO NOTHING
    `;
  await fastify.sqlite.run(sql, [user.id, user.username, user.image_id]);
}

export async function updateUsername(
  fastify: FastifyInstance,
  userId: string,
  newUsername: string,
): Promise<boolean> {
  const sql = `
    UPDATE users SET username = ? WHERE id = ?`;
  const result = await fastify.sqlite.run(sql, [newUsername, userId]);
  return (result?.changes ?? 0) > 0;
}
