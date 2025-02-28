import Match from './Match';
import type { MatchOptions } from './Match';
import Player from './Player';
import { Database } from 'sqlite';

class MatchMaking {
  matches!: Map <string, Match>;

  constructor() {
    this.matches = new Map<string, Match>();
  }

  createMatch(player: Player, gameOptions: MatchOptions, db : Database) {
    const match = new Match(gameOptions, db);
    match.addPlayerToGame(player);
    this.matches.set(match.matchId, match);
  }

  async asignUserToRandomMatch(player: Player, gameOptions: MatchOptions, db : Database) {
    const match = this.findOpenMatchWithSameMode(gameOptions);
    if (match !== undefined) {
      await match.addPlayerToGame(player);
    } else {
      this.createMatch(player, gameOptions, db);
    }
  }

  private findOpenMatchWithSameMode(gameOptions: MatchOptions): Match | undefined {
    if (this.matches.size === 0) {
      return undefined;
    }

    for (const match of this.matches.values()) {
      if (match.gameOptions.matchMode === gameOptions.matchMode
          && match.isGameFull() === false) {
        return match;
      }
    }
    return undefined;
  }

  get matchSize() {
    return this.matches.size;
  }

  joinMatch(matchId: string, player: Player) {
    const match = this.matches.get(matchId);
    if (match !== undefined) {
      match.addPlayerToGame(player);
    }
    else {
      player.sendMessage('Invalid match id');
    }
  }

//  matchInput(matchId: string, input: string, timeStamp: number) {
//    if (this.matches.get(matchId) !== undefined)
//      this.matches.get(matchId)?.matchInput( input, timeStamp);
//  }

  public printMatchStats(matchId: string) {
    if (this.matches.get(matchId) !== undefined)
      this.matches.get(matchId)?.printGameStats();
  }
}

export default MatchMaking;
