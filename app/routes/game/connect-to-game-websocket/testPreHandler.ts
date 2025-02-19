import { FastifyRequest, FastifyReply } from "fastify";

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
  };
}

export const userHook = async (req: FastifyRequest< UserRequestHeaders >, reply: FastifyReply) => {
  let userid = req.raw.headers["x-userid"];

  if (Array.isArray(userid)) {
        userid = userid[0];
    }
  console.log("THAT IS THE HEADER: " + userid);
  req.server.userId = userid;
};
