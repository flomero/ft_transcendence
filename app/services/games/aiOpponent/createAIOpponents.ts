import type { FastifyInstance } from "fastify";
import { insertUserIfNotExists } from "../../database/user";
import { saveImage } from "../../database/image/image";
import aiOpponents from "./aiOpponents";

const createAIOpponents = async (fastify: FastifyInstance): Promise<void> => {
  for (let i = 0; i < aiOpponents.length; i++) {
    await insertUserIfNotExists(fastify, {
      id: i.toString(),
      username: aiOpponents[i].username,
      image_id: await saveImage(fastify, aiOpponents[i].image),
    });
  }
};

export default createAIOpponents;
