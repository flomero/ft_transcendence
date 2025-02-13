import { FastifyInstance } from "fastify";

export interface User {
    id: string;
    username: string;
}

export async function insertUserIfNotExists(fastify: FastifyInstance, user: User) {
    await fastify.sqlite.run('INSERT INTO users (id, username) VALUES (?, ?) ON CONFLICT DO NOTHING', [user.id, user.username]);
}