import { FastifyInstance } from "fastify";

export interface User {
    id: string;
    username: string;
}

export async function insertUserIfNotExists(fastify: FastifyInstance, user: User) {
    const sql = `
    INSERT INTO users (id, username)
    VALUES (?, ?) ON CONFLICT DO NOTHING
    `;
    await fastify.sqlite.run(sql, [user.id, user.username]);
}
