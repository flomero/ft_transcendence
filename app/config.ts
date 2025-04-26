import type { GameSettings } from "./interfaces/games/lobby/GameSettings";

export enum MatchmakingGameModes {
  ClassicPong = "classicPong",
  BasicPowerUpClassicPong = "basicPowerUpClassicPong",
  MultiplayerPong5 = "multiplayerPong5",
  MultiplayerPong8 = "multiplayerPong8",
  BasicPowerUpMultiplayerPong5 = "basicPowerUpMultiplayerPong5",
  PowerUpMayhem1v1 = "powerUpMayhem1v1",
  BasicPowerUpMultiplayerPong8 = "basicPowerUpMultiplayerPong8",
  PowerUpMayhem5 = "powerUpMayhem5",
  PowerUpMayhem8 = "powerUpMayhem8",
}

export enum LobbyGameModes {
  ClassicPong = "classicPong",
  BasicPowerUpClassicPong = "basicPowerUpClassicPong",
  MultiplayerPong5 = "multiplayerPong5",
  MultiplayerPong8 = "multiplayerPong8",
  BasicPowerUpMultiplayerPong5 = "basicPowerUpMultiplayerPong5",
  PowerUpMayhem1v1 = "powerUpMayhem1v1",
  BasicPowerUpMultiplayerPong8 = "basicPowerUpMultiplayerPong8",
  PowerUpMayhem5 = "powerUpMayhem5",
  PowerUpMayhem8 = "powerUpMayhem8",
  CompetitiveClassicPong = "competitiveClassicPong",
  CompetitiveClassicPongPowerUps = "competitiveClassicPongPowerUps",
  CompetitiveMultiplayerPong = "competitiveMultiplayerPong",
  CompetitiveMultiplayerPongPowerUps = "competitiveMultiplayerPongPowerUps",
}

export enum TournamentGameModes {
  CompetitiveClassicPong = "competitiveClassicPong",
  CompetitiveClassicPongPowerUps = "competitiveClassicPongPowerUps",
  CompetitiveMultiplayerPong = "competitiveMultiplayerPong",
  CompetitiveMultiplayerPongPowerUps = "competitiveMultiplayerPongPowerUps",
}

export const TournamentGameModesPerBracketType: {
  [bracketType: string]: TournamentGameModes[];
} = {
  roundRobin: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
    TournamentGameModes.CompetitiveMultiplayerPong,
    TournamentGameModes.CompetitiveMultiplayerPongPowerUps,
  ],
  singleElimination: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
  ],
  doubleElimination: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
  ],
  swissRound: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
  ],
};

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
      goalReset: { delay: 1.5 },
      idleWallBounceAcceleration: {},
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
      timedGame: { duration: 360 },
      scoredGame: { goalObjective: 7 },
      survivalGame: {},
      goalReset: {},
      idleWallBounceAcceleration: {},
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
      idleWallBounceAcceleration: {},
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
      idleWallBounceAcceleration: {},
    },
    powerUpNames: {},
    playerCount: 8,
  },

  // All powerUps, quick game
  basicPowerUpMultiplayerPong5: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 3.5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: {
        duration: 360,
      },
      survivalGame: {},
      elimination: { threshold: 3 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {},
      multiBall: {},
      bumper: {
        bumperJunctionDistanceFromCenter: 6,
        bumperVelocityFactor: 25,
        bumperAcceleration: -20,
      },
      shooter: {},
    },
    playerCount: 5,
  },

  powerUpMayhem1v1: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {
      powerUpRadius: 5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 600 },
      scoredGame: { goalObjective: 7 },
      survivalGame: {},
      goalReset: {},
      idleWallBounceAcceleration: {
        bumperVelocityFactor: 0.25,
      },
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {
        duration: 3,
        rampUpStrength: 2,
        rampUpFrequency: 0.25,
      },
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 0.6,
      },
      multiBall: {
        ballCount: 179,
        totalAngle: 360,
        radiusFactor: 0.75,
      },
      bumper: {
        duration: 15,
        bumperMaxVelocityFactor: 250,
        bumperVelocityFactor: 100,
        bumperAcceleration: -75,
      },
      shooter: {
        chargeDuration: 1,
        shootInitialVelocityFactor: 300,
        shootAcceleration: 125,
      },
    },
    playerCount: 2,
  },

  powerUpMayhem5: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 600 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {
        bumperVelocityFactor: 0.25,
      },
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {
        duration: 3,
        rampUpStrength: 2,
        rampUpFrequency: 0.25,
      },
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 0.6,
      },
      multiBall: {
        ballCount: 179,
        totalAngle: 360,
        radiusFactor: 0.75,
      },
      bumper: {
        duration: 15,
        bumperMaxVelocityFactor: 250,
        bumperVelocityFactor: 100,
        bumperAcceleration: -75,
      },
      shooter: {
        chargeDuration: 1,
        shootInitialVelocityFactor: 300,
        shootAcceleration: 125,
      },
    },
    playerCount: 5,
  },

  powerUpMayhem8: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 600 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {
        bumperVelocityFactor: 0.25,
      },
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {
        duration: 3,
        rampUpStrength: 2,
        rampUpFrequency: 0.25,
      },
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 0.6,
      },
      multiBall: {
        ballCount: 179,
        totalAngle: 360,
        radiusFactor: 0.75,
      },
      bumper: {
        duration: 15,
        bumperMaxVelocityFactor: 250,
        bumperVelocityFactor: 100,
        bumperAcceleration: -75,
      },
      shooter: {
        chargeDuration: 1,
        shootInitialVelocityFactor: 300,
        shootAcceleration: 125,
      },
    },
    playerCount: 8,
  },

  // All powerUps, quick game
  basicPowerUpMultiplayerPong8: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 3.5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: {
        duration: 360,
      },
      survivalGame: {},
      elimination: { threshold: 3 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 10,
        delaySpan: 2.5,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {},
      multiBall: {},
      bumper: {
        bumperJunctionDistanceFromCenter: 6,
        bumperVelocityFactor: 25,
        bumperAcceleration: -20,
      },
      shooter: {},
    },
    playerCount: 8,
  },

  // Competitive 1v1
  competitiveClassicPong: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {
      ballRadius: 0.85,
      ballSpeedWidthPercentS: 62.5,
      paddleCoveragePercent: 20,
      paddleSpeedWidthPercentS: 160,
      paddleVelocityAngularTransmissionPercent: 90,
      paddleVelocitySpeedTransmissionPercent: 12.5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 600 },
      scoredGame: { goalObjective: 11 },
      survivalGame: {},
      goalReset: { delay: 2 },
      idleWallBounceAcceleration: {},
    },
    powerUpNames: {},
    playerCount: 2,
  },

  // Competitive 1v1, w/ power ups
  competitiveClassicPongPowerUps: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {
      ballRadius: 0.85,
      ballSpeedWidthPercentS: 62.5,
      paddleCoveragePercent: 20,
      paddleSpeedWidthPercentS: 160,
      paddleVelocityAngularTransmissionPercent: 90,
      paddleVelocitySpeedTransmissionPercent: 12.5,
      powerUpRadius: 3.75,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 600 },
      scoredGame: { goalObjective: 11 },
      survivalGame: {},
      goalReset: { delay: 2 },
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 11,
        delaySpan: 2.8,
      },
    },
    powerUpNames: {
      speedBoost: {},
      multiBall: {
        ballCount: 10,
        totalAngle: 60,
        radiusFactor: 80,
      },
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 1.2,
      },
      bumper: {
        bumperJunctionDistanceFromCenter: 12,
        bumperWallJunctionDistance: 95,
      },
      shooter: {
        shootInitialVelocityFactor: 250,
        shootAcceleration: 125,
      },
    },
    playerCount: 2,
  },

  // Competitive 5p, w/ power ups
  competitiveMultiplayerPong: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      ballRadius: 0.7,
      ballSpeedWidthPercentS: 70,
      paddleCoveragePercent: 20,
      paddleSpeedWidthPercentS: 100,
      paddleVelocityAngularTransmissionPercent: 90,
      paddleVelocitySpeedTransmissionPercent: 12.5,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 960 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: { delay: 2 },
      idleWallBounceAcceleration: {},
    },
    powerUpNames: {},
    playerCount: 5,
  },

  // Competitive 5p, w/ power ups
  competitiveMultiplayerPongPowerUps: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      ballRadius: 0.7,
      ballSpeedWidthPercentS: 70,
      paddleCoveragePercent: 20,
      paddleSpeedWidthPercentS: 100,
      paddleVelocityAngularTransmissionPercent: 90,
      paddleVelocitySpeedTransmissionPercent: 12.5,
      powerUpRadius: 2.75,
    },
    modifierNames: {
      timedStart: {},
      timedGame: { duration: 960 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: { delay: 2 },
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 11,
        delaySpan: 2.8,
      },
    },
    powerUpNames: {
      speedBoost: {},
      multiBall: {
        ballCount: 10,
        totalAngle: 60,
        radiusFactor: 80,
      },
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 1.2,
      },
      bumper: {
        bumperJunctionDistanceFromCenter: 12,
        bumperWallJunctionDistance: 95,
      },
      shooter: {
        shootInitialVelocityFactor: 250,
        shootAcceleration: 125,
      },
    },
    playerCount: 5,
  },
};

export type TOURNAMENT_CONFIGS_REGISTRY_TYPE = {
  [tournamentConfigName: string]: {
    bracketType: string;
    matchWinner: string;
    possiblePlayerCount: number[];
  };
};

export const TOURNAMENT_CONFIGS_REGISTRY: TOURNAMENT_CONFIGS_REGISTRY_TYPE = {
  roundRobin: {
    bracketType: "roundRobin",
    matchWinner: "bestOfX",
    possiblePlayerCount: [3, 4, 5, 6],
  },

  singleElimination: {
    bracketType: "singleElimination",
    matchWinner: "bestOfX",
    possiblePlayerCount: [4, 8, 16, 32],
  },

  doubleElimination: {
    bracketType: "singleElimination",
    matchWinner: "bestOfX",
    possiblePlayerCount: [4, 8, 16, 32],
  },

  swissRound: {
    bracketType: "singleElimination",
    matchWinner: "bestOfX",
    possiblePlayerCount: Array.from({ length: 15 }).map(
      (_, index) => 2 * (index + 1),
    ),
  },
};
