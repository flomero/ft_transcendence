import { GameSettings } from "./interfaces/games/lobby/GameSettings";

export enum MatchmakingGameModes {
  ClassicPong = "classicPong",
  BasicPowerUp1v1 = "basicPowerUp1v1",
}

export enum LobbyGameModes {
  ClassicPong = "classicPong",
}

export enum TournamentGameModes {
  ClassicPong = "classicPong",
}

export type GAMEMODE_REGISTRY_TYPE = {
  [gamemodeConfigName: string]: GameSettings;
};

export const GAMEMODE_REGISTRY: GAMEMODE_REGISTRY_TYPE = {
  // Quick 1v1, no powerUps
  classicPong: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {},
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 360 },
      scoredGame: { goalObjective: 7 },
      survivalGame: {},
      goalReset: {},
    },
    powerUpNames: {},
    playerCount: 2,
  },

  // All powerUps, quick game
  basicPowerUpClassicPong: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {},
    modifierNames: {
      timedStart: {},
      timedGame: {
        duration: 360,
      },
      scoredGame: {
        goalObjective: 7,
      },
      survivalGame: {},
      goalReset: {},
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {},
      multiBall: {},
      bumper: {},
      shooter: {},
    },
    playerCount: 2,
  },

  // Quick Multiplayer, no powerUps
  multiplayerPong5: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {},
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 360 },
      survivalGame: {},
      elimination: { threshold: 3 },
      goalReset: {},
    },
    powerUpNames: {},
    playerCount: 5,
  },

  // Quick Multiplayer, no powerUps
  multiplayerPong8: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {},
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 360 },
      survivalGame: {},
      elimination: { threshold: 3 },
      goalReset: {},
    },
    powerUpNames: {},
    playerCount: 8,
  },

  // All powerUps, quick game
  basicPowerUpMultiplayerPong: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {},
    modifierNames: {
      timedStart: {},
      timedGame: {
        duration: 360,
      },
      scoredGame: {
        goalObjective: 7,
      },
      survivalGame: {},
      goalReset: {},
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {},
      multiBall: {},
      bumper: {},
      shooter: {},
    },
    playerCount: 5,
  },
};

export const TOURNAMENT_CONFIGS_REGISTRY = {
  roundRobin: {
    bracketType: "roundRobin",
    matchWinner: "bestOfX",
  },
};
