import { downloadImageAsBase64 } from "../images/downloadImage";
import { insertUserIfNotExists, userExists } from "../database/user";
import { GoogleUserInfo } from "./google-api";
import { FastifyInstance } from "fastify";
import { saveImage } from "../database/image/image";

export async function insertUser(
  fastify: FastifyInstance,
  userInfo: GoogleUserInfo,
): Promise<void> {
  if (await userExists(fastify, userInfo.id)) {
    return;
  }

  const base64Image = await downloadImageAsBase64(userInfo.picture);
  const imageUUID = await saveImage(fastify, base64Image);

  await insertUserIfNotExists(fastify, {
    id: userInfo.id,
    username: userInfo.name,
    image_id: imageUUID,
  });
}
