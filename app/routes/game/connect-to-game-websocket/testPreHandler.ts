import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

const headersJsonSchema = {
  type: 'object',
  properties: {
    'x-userId': { type: 'string' }
  },
  required: ['x-userId']
}

export const hookSchema = {
  headers: headersJsonSchema
}

interface UserRequestHeaders {
  Headers: {
    'x-userId': string;
    'x-username': string;
  };
}

const testAddUser: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.post('/test-add-user', async (request: FastifyRequest<{ Body: { id : string, username: string} }>, reply: FastifyReply) => {
        const { id , username} = request.body;

        console.log("ID: " + id + " USERNAME: " + username);
        try {
            await fastify.sqlite.run("INSERT INTO users (id, username) VALUES (?, ?)", [id, username]);
            reply.send({ success: true, username });
        } catch (err) {
            if (err instanceof Error) {
                reply.send({ error: err.message });
            } else {
                reply.send({ error: 'An unknown error occurred' });
            }
        }
    });
};

export const userHook = async (req: FastifyRequest< UserRequestHeaders >, reply: FastifyReply) => {
  let userid = req.raw.headers["x-userid"];
  let userName = req.raw.headers["x-username"];

  if (Array.isArray(userid)) {
        userid = userid[0];
  }
  if (Array.isArray(userName)) {
    userName = userName[0];
  }
  console.log("THAT IS THE HEADER: " + userid + " " + userName);
  if (!userid || !userName) {
    reply.status(400).send({ error: 'Missing required headers' });
    return;
  }
  req.server.userId = userid;
  req.server.userName = userName;
};

export default testAddUser;
