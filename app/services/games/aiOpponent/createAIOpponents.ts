import type { FastifyInstance } from "fastify";
import { insertUserIfNotExists, userExists } from "../../database/user";
import { saveImage } from "../../database/image/image";
import aiOpponents from "./aiOpponents";

const createAIOpponents = async (fastify: FastifyInstance): Promise<void> => {
  for (let i = 0; i < aiOpponents.length; i++) {
    if (await userExists(fastify, i.toString())) {
      continue;
    }
    await insertUserIfNotExists(fastify, {
      id: i.toString(),
      username: aiOpponents[i].username,
      image_id: await saveImage(fastify, aiOpponents[i].image),
    });
  }
};

export default createAIOpponents;
