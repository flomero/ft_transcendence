import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Counter } from "prom-client";

export default fp(async (fastify: FastifyInstance) => {
  const jwtVerifyCounter = new Counter({
    name: "jwt_verify_total",
    help: "Total number of JWT tokens verified",
    labelNames: ["status"],
  });

  fastify.decorate("countJwtVerify", (status: "success" | "failure") => {
    jwtVerifyCounter.inc({ status });
  });
});

// TypeScript declaration

declare module "fastify" {
  interface FastifyInstance {
    countJwtVerify(status: "success" | "failure"): void;
  }
}
