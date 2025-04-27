import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Counter, Gauge } from "prom-client";
import { getCountOnlineChatUsers } from "../services/chat/live";
import { gameManagers } from "../services/games/lobby/start/startLobbyHandler";
import {
  PrivateLobbies,
  PublicLobbies,
} from "../services/games/lobby/new/newLobbyHandler";

// Extend FastifyInstance to include prisma
declare module "fastify" {
  interface FastifyInstance {
    customMetrics: CustomMetrics;
  }
}

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

  const onlineUsersGauge = new Gauge({
    name: "online_users",
    help: "Current number of online users",
    async collect() {
      try {
        const count = await getCountOnlineChatUsers();
        this.set(count);
      } catch (error) {
        console.error("Error getting online users count:", error);
        this.set(0);
      }
    },
  });

  const activeGamesGauge = new Gauge({
    name: "active_games",
    help: "Current number of active games",
    async collect() {
      try {
        this.set(gameManagers.size);
      } catch (error) {
        console.error("Error getting active games count:", error);
        this.set(0);
      }
    },
  });

  const activeLobbiesGauge = new Gauge({
    name: "active_lobbies",
    help: "Current number of active game lobbies",
    async collect() {
      try {
        const lobbies = PrivateLobbies.size + PublicLobbies.size;
        this.set(lobbies);
      } catch (error) {
        console.error("Error getting active lobbies count:", error);
        this.set(0);
      }
    },
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
    getOnlineUsers: async () => {
      const value = await onlineUsersGauge.get();
      return value.values[0].value;
    },
    getActiveGames: async () => {
      const value = await activeGamesGauge.get();
      return value.values[0].value;
    },
    getActiveLobbies: async () => {
      const value = await activeLobbiesGauge.get();
      return value.values[0].value;
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
  getOnlineUsers(): Promise<number>;
  getActiveGames(): Promise<number>;
  getActiveLobbies(): Promise<number>;
}
