import { FastifyInstance } from "fastify";
import { User } from "../user";

export async function searchUsers(
  fastify: FastifyInstance,
  username: string,
): Promise<User[]> {
  return fastify.sqlite.all(
    "SELECT * FROM users WHERE username LIKE ? LIMIT 10",
    [`%${username}%`],
  );
}
