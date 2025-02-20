import { WebSocket } from 'ws';

class Match {
  private players: WebSocket[] = [];
  private matchId: number;
  private matchState: MatchState = MatchState.WAITING;

  constructor(matchId: number) {
    this.matchId = matchId;
  }

  public addPlayer(player: WebSocket) {
    this.players.push(player);
  }

  public removePlayer(player: WebSocket) {
    this.players = this.players.filter(p => p !== player);
  }

  public getPlayers() {
    return this.players;
  }

  public getMatchId() {
    return this.matchId;
  }

  public getMatchState() {
    return this.matchState;
  }

  public setMatchState(state: MatchState) {
    this.matchState = state;
  }
}

class MatchMaking {


  private 
}
