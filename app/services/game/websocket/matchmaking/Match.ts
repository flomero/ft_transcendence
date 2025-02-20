import Player from './Player';

class Match {
  private _players: Player[] = [];
  private _matchId: number;
  gameOptions: GameOptions;

  constructor(matchId: number, gameOptions: GameOptions) {
    this._matchId = matchId;
    this.gameOptions = gameOptions;
  }
}


type GameOptions = 
  | { gameType: 'VanillaDouble'; numberOfPlayers: 2 }
  | { gameType: 'ModdedDouble'; numberOfPlayers: 2; modifiers: Modifiers[] }
  | { gameType: 'VanillaMulti'; numberOfPlayers: 8 }
  | { gameType: 'ModdedMulti'; numberOfPlayers: 8; modifiers: Modifiers[] };

type Modifiers = {
    "blackwhole" | "speedUpBall";
}


