import { GameSettings } from "./interfaces/games/lobby/GameSettings";

export enum MatchmakingGameModes {
  ClassicPong = "classicPong",
  BasicPowerUpClassicPong = "basicPowerUpClassicPong",
  MultiplayerPong5 = "multiplayerPong5",
  MultiplayerPong8 = "multiplayerPong8",
  BasicPowerUpMultiplayerPong5 = "basicPowerUpMultiplayerPong5",
  BasicPowerUpMultiplayerPong8 = "basicPowerUpMultiplayerPong8",
}

export enum LobbyGameModes {
  ClassicPong = "classicPong",
}

export enum TournamentGameModes {
  ClassicPong = "classicPong",
  BasicPowerUp1v1 = "basicPowerUp1v1",
}

export const TournamentGameModesPerBracketType: {
  [bracketType: string]: TournamentGameModes[];
} = {
  roundRobin: [
    TournamentGameModes.ClassicPong,
    TournamentGameModes.BasicPowerUp1v1,
  ],
  singleElimination: [
    TournamentGameModes.ClassicPong,
    TournamentGameModes.BasicPowerUp1v1,
  ],
  doubleElimination: [
    TournamentGameModes.ClassicPong,
    TournamentGameModes.BasicPowerUp1v1,
  ],
  swissRound: [
    TournamentGameModes.ClassicPong,
    TournamentGameModes.BasicPowerUp1v1,
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
