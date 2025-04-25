import type { FastifyPluginAsync } from "fastify";
import { getUserById, updateUsername } from "../../services/database/user";
import { signJWT, verifyJWT } from "../../services/auth/jwt";
import { updateImage } from "../../services/database/image/image";

const updateProfile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/update/username", async (request, reply) => {
    const token = request.cookies.token;
    if (!request.isAuthenticated || !token) {
      return reply
        .code(401)
        .send({ error: "You are not authorized to authenticate" });
    }

    let newUsername = request.body as string;
    newUsername = newUsername.trim();
    if (newUsername.length < 3) {
      return reply
        .code(400)
        .send({ error: "Username must be at least 3 characters long" });
    }

    if (!(await updateUsername(fastify, request.userId, newUsername))) {
      return reply.code(500).send({ error: "Failed to update username" });
    }

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
    if (!request.isAuthenticated) {
      return reply
        .code(401)
        .send({ error: "You are not authorized to authenticate" });
    }
    const userData = await getUserById(fastify, request.userId);
    if (!userData) {
      return reply.code(500).send({ error: "Failed to get user data" });
    }

    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "No file uploaded" });
    }
    if (
      file.mimetype !== "image/png" &&
      file.mimetype !== "image/jpeg" &&
      file.mimetype !== "image/gif"
    ) {
      return reply.code(401).send({ error: "Invalid file upload" });
    }

    const base64 = (await file.toBuffer()).toString("base64");
    const completeData = `data:${file.mimetype};base64,${base64}`;
    await updateImage(fastify, userData.image_id, completeData);

    return reply.code(200).send({});
  });
};

export default updateProfile;
