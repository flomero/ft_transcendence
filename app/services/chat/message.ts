import {FastifyInstance} from "fastify";

export async function postMessage(fastify: FastifyInstance, roomId: number, userId: string, message: string): Promise<void> {
    const sql = "INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)";
    await fastify.sqlite.run(sql, [roomId, userId, message]);
    fastify.log.trace("Inserted message %s from user %s in room %s", message, userId, roomId);
}

export async function getMessages(fastify: FastifyInstance, roomId: number): Promise<any[]> {
    const sql = "SELECT * FROM messages WHERE room_id = ?";
    return await fastify.sqlite.all(sql, [roomId]);
}

export async function getMessagesWithUserInfo(fastify: FastifyInstance, roomId: number): Promise<any[]> {
    const sql = "SELECT messages.*, users.username FROM messages JOIN users ON messages.sender_id = users.id WHERE room_id = ?";
    return await fastify.sqlite.all(sql, [roomId]);
}
