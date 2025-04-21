export enum MatchmakingGameModes {
  ClassicPong = "classicPong",
  SpeedBoostClassicPong = "speedBoostClassicPong",
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
    },
    powerUpNames: {},
    playerCount: 2,
  },
  speedBoostClassicPong: {
    gameName: "pong",
    gameModeName: "classicPong",
    gameModeConfig: {},
    modifierNames: {
      scoredGame: {},
      timedGame: {},
      powerUpSpawner: {},
    },
    powerUpNames: {
      speedBoost: {},
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
