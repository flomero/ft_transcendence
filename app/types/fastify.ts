declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userName: string;
    isAuthenticated: boolean;
  }
}
