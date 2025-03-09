import { randomUUID, UUID } from "node:crypto";
import { FastifyInstance } from "fastify";

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
