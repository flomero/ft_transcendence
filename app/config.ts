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
  TestLobby = "testLobby",

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
  PowerUpMayhem1v1 = "powerUpMayhem1v1",
}

export const TournamentGameModesPerBracketType: {
  [bracketType: string]: TournamentGameModes[];
} = {
  roundRobin: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
    TournamentGameModes.CompetitiveMultiplayerPong,
    TournamentGameModes.CompetitiveMultiplayerPongPowerUps,
    TournamentGameModes.PowerUpMayhem1v1,
  ],
  singleElimination: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
    TournamentGameModes.PowerUpMayhem1v1,
  ],
  doubleElimination: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
    TournamentGameModes.PowerUpMayhem1v1,
  ],
  swissRound: [
    TournamentGameModes.CompetitiveClassicPong,
    TournamentGameModes.CompetitiveClassicPongPowerUps,
    TournamentGameModes.PowerUpMayhem1v1,
  ],
};

export type GAMEMODE_REGISTRY_TYPE = {
  [gamemodeConfigName: string]: GameSettings;
};

export const GAMEMODE_REGISTRY: GAMEMODE_REGISTRY_TYPE = {
  // testLobby: {
  //   gameName: "pong",
  //   gameModeName: "multiplayerPong",
  //   gameModeConfig: {
  //     ballSpeedWidthPercentS: 0.00000001,
  //     powerUpRadius: 0.15,
  //     powerUpCapacities: {
  //       speedBoost: 100000,
  //     },
  //   },
  //   modifierNames: {
  //     powerUpSpawner: {
  //       meanDelay: 0.001,
  //       delaySpan: 0.0005,
  //       positionSamplerStrategyName: "flowerGaussianCA",
  //     },
  //   },
  //   powerUpNames: {
  //     speedBoost: {},
  //   },
  //   playerCount: 5,
  // },

  testLobby: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 25,
    },
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 600 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 1.25,
        delaySpan: 0.25,
      },
    },
    powerUpNames: {
      // speedBoost: {},
      // blinkingBall: {
      //   duration: 6,
      //   blinkDuration: 75,
      //   blinkInterval: 0.6,
      // },
      // multiBall: {
      //   ballCount: 17,
      //   totalAngle: 360,
      //   radiusFactor: 72.5,
      // },
      // bumper: {
      //   bumperJunctionDistanceFromCenter: 6,
      // },
      // shooter: {
      //   chargeRadius: 3.5,
      // },
      // portals: {
      // },
      // speedGate: {}
      protectedPowerUp: {},
      // bumperShield: {
      //   wallGoalOffsetArenaWidthFactor: 12,
      //   wallTotalWidthArenaWidthFactor: 18,
      //   wallsHitThresold: 3,
      // },
    },
    playerCount: 5,
  },

  // Quick 1v1, no powerUps
  classicPong: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {},
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 360 },
      scoredGame: { goalObjective: 7 },
      survivalGame: {},
      elimination: { threshold: 8 },
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
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 360 },
      scoredGame: { goalObjective: 7 },
      survivalGame: {},
      elimination: { threshold: 8 },
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
      portals: {},
      speedGate: {},
      protectedPowerUp: {},
      bumperShield: {
        wallGoalOffsetArenaWidthFactor: 12,
        wallTotalWidthArenaWidthFactor: 18,
        wallsHitThresold: 3,
      },
    },
    playerCount: 2,
  },

  // Quick Multiplayer, no powerUps
  multiplayerPong5: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {},
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 360 },
      survivalGame: {},
      elimination: { threshold: 3 },
      arenaShrink: {},
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
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 360 },
      survivalGame: {},
      elimination: { threshold: 3 },
      arenaShrink: {},
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
      paceBreaker: {},
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
      bumper: {},
      shooter: {
        chargeRadius: 3.5,
      },
      portals: {},
      speedGate: {
        initialBallSizeSmallPortalWidthFactor: 900,
        initialBallSizeBigPortalWidthFactor: 1300,
      },
      protectedPowerUp: {},
      bumperShield: {
        wallTotalWidthArenaWidthFactor: 8,
        wallJunctionArenaWidthFactor: 50,
        wallsHitThresold: 2,
      },
    },
    playerCount: 5,
  },

  // All powerUps, quick game
  basicPowerUpMultiplayerPong8: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 3.5,
    },
    modifierNames: {
      paceBreaker: {},
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
      bumper: {},
      shooter: {
        chargeRadius: 3.5,
      },
      portals: {},
      speedGate: {
        initialBallSizeSmallPortalWidthFactor: 900,
        initialBallSizeBigPortalWidthFactor: 1300,
      },
      protectedPowerUp: {},
      bumperShield: {
        wallTotalWidthArenaWidthFactor: 8,
        wallJunctionArenaWidthFactor: 50,
        wallsHitThresold: 2,
      },
    },
    playerCount: 8,
  },

  powerUpMayhem1v1: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {
      powerUpRadius: 6.5,
    },
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 600 },
      scoredGame: { goalObjective: 7 },
      survivalGame: {},
      elimination: { threshold: 8 },
      goalReset: {},
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 8.5,
        delaySpan: 1.75,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 0.6,
      },
      multiBall: {
        ballCount: 17,
        totalAngle: 360,
        radiusFactor: 72.5,
      },
      bumper: {},
      shooter: {},
      portals: {},
      speedGate: {},
      protectedPowerUp: {},
      bumperShield: {
        wallGoalOffsetArenaWidthFactor: 12,
        wallTotalWidthArenaWidthFactor: 18,
        wallsHitThresold: 3,
      },
    },
    playerCount: 2,
  },

  powerUpMayhem5: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 6,
    },
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 600 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 8.5,
        delaySpan: 1.75,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 0.6,
      },
      multiBall: {
        ballCount: 17,
        totalAngle: 360,
        radiusFactor: 72.5,
      },
      bumper: {
        bumperJunctionDistanceFromCenter: 6,
      },
      shooter: {
        chargeRadius: 3.5,
      },
      portals: {},
      speedGate: {
        initialBallSizeSmallPortalWidthFactor: 900,
        initialBallSizeBigPortalWidthFactor: 1300,
        sizeFactor: 1.8,
        speedFactor: 1.3,
      },
      protectedPowerUp: {},
      bumperShield: {
        wallTotalWidthArenaWidthFactor: 8,
        wallJunctionArenaWidthFactor: 50,
        wallsHitThresold: 2,
      },
    },
    playerCount: 5,
  },

  powerUpMayhem8: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      powerUpRadius: 6,
    },
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 600 },
      survivalGame: {},
      elimination: { threshold: 5 },
      arenaShrink: {},
      goalReset: {},
      idleWallBounceAcceleration: {},
      powerUpSpawner: {
        meanDelay: 8.5,
        delaySpan: 1.75,
      },
    },
    powerUpNames: {
      speedBoost: {},
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 0.6,
      },
      multiBall: {
        ballCount: 17,
        totalAngle: 360,
        radiusFactor: 72.5,
      },
      bumper: {
        bumperJunctionDistanceFromCenter: 6,
      },
      shooter: {
        chargeRadius: 3.5,
      },
      portals: {},
      speedGate: {
        initialBallSizeSmallPortalWidthFactor: 900,
        initialBallSizeBigPortalWidthFactor: 1300,
        sizeFactor: 1.8,
        speedFactor: 1.3,
      },
      protectedPowerUp: {},
      bumperShield: {
        wallTotalWidthArenaWidthFactor: 8,
        wallJunctionArenaWidthFactor: 50,
        wallsHitThresold: 2,
      },
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
      paddleCoveragePercent: 22.5,
      paddleSpeedWidthPercentS: 0.8,
      paddleVelocityAngularTransmissionPercent: 5,
      paddleVelocitySpeedTransmissionPercent: 20,
    },
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 600 },
      scoredGame: { goalObjective: 11 },
      survivalGame: {},
      elimination: { threshold: 12 },
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
      paddleCoveragePercent: 22.5,
      paddleSpeedWidthPercentS: 0.8,
      paddleVelocityAngularTransmissionPercent: 5,
      paddleVelocitySpeedTransmissionPercent: 17.5,
      powerUpRadius: 3.75,
    },
    modifierNames: {
      paceBreaker: {},
      timedStart: {},
      timedGame: { duration: 600 },
      scoredGame: { goalObjective: 11 },
      survivalGame: {},
      elimination: { threshold: 12 },
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
        totalAngle: 35,
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
      shooter: {},
      portals: {},
      speedGate: {},
      protectedPowerUp: {},
      bumperShield: {
        wallGoalOffsetArenaWidthFactor: 12,
        wallTotalWidthArenaWidthFactor: 18,
        wallsHitThresold: 3,
      },
    },
    playerCount: 2,
  },

  // Competitive 5p
  competitiveMultiplayerPong: {
    gameName: "pong",
    gameModeName: "multiplayerPong",
    gameModeConfig: {
      ballRadius: 0.65,
      ballSpeedWidthPercentS: 70,
      paddleCoveragePercent: 22.5,
      paddleSpeedWidthPercentS: 0.755,
      paddleVelocityAngularTransmissionPercent: 90,
      paddleVelocitySpeedTransmissionPercent: 12.5,
    },
    modifierNames: {
      paceBreaker: {},
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
      ballRadius: 0.65,
      ballSpeedWidthPercentS: 70,
      paddleCoveragePercent: 22.5,
      paddleSpeedWidthPercentS: 0.755,
      paddleVelocityAngularTransmissionPercent: 90,
      paddleVelocitySpeedTransmissionPercent: 12.5,
      powerUpRadius: 2.75,
    },
    modifierNames: {
      paceBreaker: {},
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
        totalAngle: 35,
        radiusFactor: 80,
      },
      blinkingBall: {
        duration: 6,
        blinkDuration: 75,
        blinkInterval: 1.2,
      },
      bumper: {
        bumperJunctionDistanceFromCenter: 6,
      },
      shooter: {
        chargeRadius: 3.5,
      },
      portals: {
        portalWallWidthHeightFactor: 30,
      },
      speedGate: {
        initialBallSizeSmallPortalWidthFactor: 900,
        initialBallSizeBigPortalWidthFactor: 1300,
      },
      protectedPowerUp: {},
      bumperShield: {
        wallTotalWidthArenaWidthFactor: 8,
        wallJunctionArenaWidthFactor: 50,
        wallsHitThresold: 2,
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
    initialSeedingMethod?: string;
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
    initialSeedingMethod: "random",
    possiblePlayerCount: [4, 8, 16, 32],
  },

  doubleElimination: {
    bracketType: "singleElimination",
    matchWinner: "bestOfX",
    initialSeedingMethod: "random",
    possiblePlayerCount: [4, 8, 16, 32],
  },

  swissRound: {
    bracketType: "singleElimination",
    matchWinner: "bestOfX",
    initialSeedingMethod: "random",
    possiblePlayerCount: Array.from({ length: 15 }).map(
      (_, index) => 2 * (index + 1),
    ),
  },
};
