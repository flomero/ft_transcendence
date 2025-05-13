import type { FastifyInstance } from "fastify";
import {
  insertUserIfNotExists,
  localPlayerWithImage,
  userExists,
} from "../../database/user";
import { saveImage } from "../../database/image/image";
import aiOpponents from "./aiOpponents";
import { localPlayerImage } from "./localPlayer";

export const createAIOpponents = async (
  fastify: FastifyInstance,
): Promise<void> => {
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

export const createLocalPlayer = async (
  fastify: FastifyInstance,
): Promise<void> => {
  if (await userExists(fastify, "localPlayer")) {
    return;
  }

  const image_uuid = await saveImage(fastify, localPlayerImage);
  await insertUserIfNotExists(fastify, {
    id: "localPlayer",
    username: "localPlayer",
    image_id: image_uuid,
  });

  localPlayerWithImage.image_uuid = image_uuid;
};

// export default createAIOpponents;
