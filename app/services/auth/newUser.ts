import { downloadImageAsBase64 } from "../images/downloadImage";
import {
  insertUserIfNotExists,
  userExists,
  usernameExists,
} from "../database/user";
import type { GoogleUserInfo } from "./google-api";
import type { FastifyInstance } from "fastify";
import { saveImage } from "../database/image/image";

export async function insertUser(
  fastify: FastifyInstance,
  userInfo: GoogleUserInfo,
): Promise<void> {
  if (await userExists(fastify, userInfo.id)) {
    return;
  }
  if (userInfo.name.length < 3) userInfo.name += 4242;
  if (userInfo.name.length > 16) userInfo.name = userInfo.name.slice(0, 16);

  while (await usernameExists(fastify, userInfo.name)) {
    userInfo.name = `${userInfo.name}#${Math.floor(Math.random() * 1000)}`;
  }

  fastify.customMetrics.newUser();

  const base64Image = await downloadImageAsBase64(userInfo.picture);
  const imageUUID = await saveImage(fastify, base64Image);

  await insertUserIfNotExists(fastify, {
    id: userInfo.id,
    username: userInfo.name,
    image_id: imageUUID,
  });
}
