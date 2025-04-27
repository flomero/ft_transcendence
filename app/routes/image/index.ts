import type { FastifyPluginAsync } from "fastify";
import type { UUID } from "node:crypto";
import { getImage } from "../../services/database/image/image";

const image: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:uuid", async (request, reply) => {
    const { uuid } = request.params as { uuid: UUID };
    if (!uuid) return reply.badRequest("Image UUID is required");

    const dataUrl = await getImage(fastify, uuid);
    if (!dataUrl) return reply.notFound("Image not found");

    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3)
      return reply.internalServerError("Invalid image data format");

    const contentType = matches[1];
    const base64Data = matches[2];

    const imageBuffer = Buffer.from(base64Data, "base64");

    reply.header("Content-Type", contentType);
    return reply.send(imageBuffer);
  });
};

export default image;
