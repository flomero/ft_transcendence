import { randomUUID, type UUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

export async function getImage(
  fastify: FastifyInstance,
  id: UUID,
): Promise<string> {
  const sql = `
    SELECT data FROM images WHERE id = ?
  `;
  const result = await fastify.sqlite.get(sql, id);
  if (!result) {
    throw new Error("Image not found");
  }
  return result.data;
}

export async function saveImage(
  fastify: FastifyInstance,
  base64: string,
): Promise<UUID> {
  const newUUID = randomUUID();

  const sql = `
    INSERT INTO images (id, data) VALUES (?, ?)
  `;
  await fastify.sqlite.run(sql, newUUID, base64);

  return newUUID;
}

export async function updateImage(
  fastify: FastifyInstance,
  id: UUID,
  base64: string,
): Promise<void> {
  const sql = `
    UPDATE images SET data = ? WHERE id = ?
  `;
  await fastify.sqlite.run(sql, base64, id);
}
