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

export const GAMEMODE_REGISTRY = {
  classicPong: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {},
    modifierNames: {
      timedGame: {},
      scoredGame: {},
      survivalGame: {},
    },
    powerUpNames: {},
    playerCount: 2,
  },

  basicPowerUp1v1: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {},
    modifierNames: {
      timedStart: {},
      timedGame: {
        duration: 360,
      },
      scoredGame: {
        threshold: 7,
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
};

export const TOURNAMENT_CONFIGS_REGISTRY = {
  roundRobin: {
    bracketType: "roundRobin",
    matchWinner: "bestOfX",
  },
};
