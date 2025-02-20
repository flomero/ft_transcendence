import Player from './Player';
import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';

class Match {
  private _players: Player[] = [];
  private _matchId: string = uuidv4();
  private _numberOfPlayers: number = 0;
  private _gameOptions: GameOptions;
  private _connectionToDB: Database;


  constructor(firstPlayer: Player, gameOptions: GameOptions) {
    this._gameOptions = gameOptions;
    this._numberOfPlayers = this.setNumberOfPlayers(gameOptions);
    this._connectionToDB = firstPlayer.databaseConnection;
    this.addMatchToDB();
  }

  private setNumberOfPlayers(gameOptions: GameOptions): number {
    if (gameOptions.gameType.includes("Modded") === false)
      return (2);
    else
      return (8);
  }

  addPlayer(player: Player) {
    if (this._players.length != this._numberOfPlayers) {
      this._players.push(player);
      this.sendMessageToAllPlayers(
        "Player " + "name will come" + " has joined the match");
    }
    else {
      player.sendMessage("Match is full");
    }
  }

  sendMessageToAllPlayers(message: string) {
    this._players.forEach(player => {
      player.sendMessage(message);
    });
  }

  get gameOptions() {
    return this._gameOptions;
  }

  get matchId() {
    return this._matchId;
  }

  isGameFull(): boolean {
    return (this._players.length === this._numberOfPlayers);
  }

  addMatchToDB(): void {
    if (!this._connectionToDB)
      return;
    const sql = `INSERT INTO matches (id, game, gameMode) VALUES (?, ?, ?)`;
    this._connectionToDB.run(sql, [this._matchId, "Pong", this._gameOptions.gameType]);
  }


}


type GameOptions = 
  { gameType: 'VanillaDouble'; }
  | { gameType: 'ModdedDouble'; modifiers: Modifiers[] }
  | { gameType: 'VanillaMulti'; }
  | { gameType: 'ModdedMulti'; modifiers: Modifiers[] };

type Modifiers = "blackwhole" | "speedUpBall";

export type { GameOptions, Modifiers };
export default Match;
