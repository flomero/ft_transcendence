import Match from './Match';
import type { GameOptions } from './Match';
import Player from './Player';

class MatchMaking {
  matches: Map <string, Match>;

  constructor() {
    this.matches = new Map();
  }

  createaMatch(gameOptions: GameOptions, player: Player) {
    const match = new Match(player, gameOptions);
    match.addPlayer(player);
    this.matches.set(match.matchId, match);
  }

  asignUserToRandomMatch(player: Player, gameOptions: GameOptions) {
    const match = this.findOpenMatchWithSameMode(gameOptions);
    if (match !== undefined) {
      match.addPlayer(player);
    } else {
      this.createaMatch(gameOptions, player);
    }
  }

  private findOpenMatchWithSameMode(gameOptions: GameOptions): Match | undefined {
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
      match.addPlayer(player);
    }
    else {
      player.sendMessage('Invalid match id');
    }
  }

}

export default MatchMaking;
