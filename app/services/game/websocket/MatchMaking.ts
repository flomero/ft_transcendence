import Match from './Match';
import type { GameOptions } from './Match';
import Player from './Player';
import { Database } from 'sqlite';

class MatchMaking {
  private matches!: Map <string, Match>;

  constructor() {
  }

  createaMatch(player: Player, gameOptions: GameOptions, db : Database) {
    const match = new Match(player, gameOptions, db);
    match.addPlayerToGame(player);
    this.matches.set(match.matchId, match);
  }

  async asignUserToRandomMatch(player: Player, gameOptions: GameOptions, db : Database) {
    const match = this.findOpenMatchWithSameMode(gameOptions);
    if (match !== undefined) {
      await match.addPlayerToGame(player);
    } else {
      this.createaMatch(player, gameOptions, db);
    }
  }

  private findOpenMatchWithSameMode(gameOptions: GameOptions): Match | undefined {
    if (this.matches.size === 0) {
      return undefined;
    }
    for (const match of this.matches.values()) {
      if (match.gameOptions.gameType === gameOptions.gameType
          && match.isGameFull() === false) {
        return match;
      }
    }
    return undefined;
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

}

export default MatchMaking;
