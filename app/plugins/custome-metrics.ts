import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Counter } from "prom-client";

export default fp(async (fastify: FastifyInstance) => {
  const jwtVerifyCounter = new Counter({
    name: "jwt_verify_total",
    help: "Total number of JWT tokens verified",
    labelNames: ["status"],
  });

  const googleLoginCounter = new Counter({
    name: "login_google_total",
    help: "Total number of Google Logins",
    labelNames: ["status"],
  });

  const newUserCounter = new Counter({
    name: "new_user_total",
    help: "Total number of new USers",
    labelNames: ["status"],
  });

  const chatMsgCounter = new Counter({
    name: "chat_msg_total",
    help: "Total number of chat msg send",
    labelNames: ["roomId"],
  });

  const gameStartedCounter = new Counter({
    name: "game_started_total",
    help: "Total number of games started",
  });

  const customMetrics: CustomMetrics = {
    countJwtVerify: (status: "success" | "failure") => {
      jwtVerifyCounter.inc({ status });
    },
    googleLogin: (status: "success" | "failure") => {
      googleLoginCounter.inc({ status });
    },
    newUser: () => {
      newUserCounter.inc({});
    },
    countChatMsg: (roomId: number) => {
      chatMsgCounter.inc({ roomId });
    },
    countGameStarted: () => {
      gameStartedCounter.inc();
    },
  };

  fastify.decorate("customMetrics", customMetrics);
});

interface CustomMetrics {
  countJwtVerify(status: "success" | "failure"): void;
  googleLogin(status: "success" | "failure"): void;
  newUser(): void;
  countChatMsg(roomId: number): void;
  countGameStarted(): void;
}

// TypeScript declaration
declare module "fastify" {
  interface FastifyInstance {
    customMetrics: CustomMetrics;
  }
}
