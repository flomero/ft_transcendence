import { FastifyPluginAsync } from "fastify";
import { UUID } from "node:crypto";
import { getImage } from "../../services/database/image/image";

const image: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:uuid", async function (request, reply) {
    const { uuid } = request.params as { uuid: UUID };
    if (!uuid) {
      return reply.status(400).send({ error: "Image UUID is required" });
    }

    const dataUrl = await getImage(fastify, uuid);
    if (!dataUrl) {
      return reply.status(404).send({ error: "Image not found" });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return reply.status(500).send({ error: "Invalid image data format" });
    }

    const contentType = matches[1];
    const base64Data = matches[2];

    // Convert base64 to binary
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Set proper Content-Type header and return binary data
    reply.header("Content-Type", contentType);
    return reply.send(imageBuffer);
  });
};

export default image;
