import { FastifyRequest } from "fastify";

declare module 'fastify' {
    interface FastifyRequest {
      userId: string;
      userName: string;
      isAuthenticated: boolean;
    }

    interface FastifyInstance {
      userId: string;
      userName: string;
    }
  }
