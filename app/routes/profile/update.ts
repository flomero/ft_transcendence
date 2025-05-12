import type { FastifyPluginAsync } from "fastify";
import {
  getUserById,
  updateUsername,
  usernameExists,
} from "../../services/database/user";
import { signJWT, verifyJWT } from "../../services/auth/jwt";
import { updateImage } from "../../services/database/image/image";

const updateProfile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/update/username", async (request, reply) => {
    const token = request.cookies.token;
    if (!request.isAuthenticated || !token)
      return reply.unauthorized("You are not authorized to authenticate");

    let newUsername = request.body as string;
    newUsername = newUsername.trim();
    if (newUsername.length < 3 || newUsername.length > 32)
      return reply.badRequest(
        "Username must be at least 3 characters long and at most 32 characters long",
      );

    if (await usernameExists(fastify, newUsername)) {
      return reply.conflict("Username already taken");
    }
    if (!(await updateUsername(fastify, request.userId, newUsername)))
      return reply.internalServerError("Failed to update username");

    const decoded = await verifyJWT(fastify, token);

    const jwtToken = await signJWT(fastify, {
      id: decoded.id,
      name: newUsername,
      token: decoded.token,
    });

    reply.cookie("token", jwtToken, {
      path: "/",
    });

    return reply.code(200).send({});
  });

  fastify.post("/update/image", async (request, reply) => {
    if (!request.isAuthenticated)
      return reply.unauthorized("You are not authorized to authenticate");
    const userData = await getUserById(fastify, request.userId);
    if (!userData) return reply.notFound("User not found");

    const file = await request.file();
    if (!file) return reply.badRequest("File is required");
    if (
      file.mimetype !== "image/png" &&
      file.mimetype !== "image/jpeg" &&
      file.mimetype !== "image/gif"
    )
      return reply.badRequest(
        "Invalid file type. Only PNG, JPEG, and GIF are allowed",
      );

    const base64 = (await file.toBuffer()).toString("base64");
    const completeData = `data:${file.mimetype};base64,${base64}`;
    await updateImage(fastify, userData.image_id, completeData);

    return reply.code(200).send({});
  });
};

export default updateProfile;
