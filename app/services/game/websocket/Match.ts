import Player from './Player';
import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';

type GameOptions =
  { gameType: 'VanillaDouble'; }
    | { gameType: 'ModdedDouble'; modifiers: Modifiers[] }
    | { gameType: 'VanillaMulti'; }
    | { gameType: 'ModdedMulti'; modifiers: Modifiers[] };

type Modifiers = "blackwhole" | "speedUpBall";

class Match {
  private _players: Player[] = [];
  private _matchId: string = uuidv4();
  private _numberOfPlayers: number = 0;
  private _gameOptions: GameOptions;
  private _connectionToDB: Database;


  constructor(firstPlayer: Player, gameOptions: GameOptions, dbConneection: Database) {
    this._gameOptions = gameOptions;
    this._numberOfPlayers = this.setNumberOfPlayers(gameOptions);
    this._connectionToDB = dbConneection;
  }

  private setNumberOfPlayers(gameOptions: GameOptions): number {
    if (gameOptions.gameType.includes("Modded") === false)
      return (2);
    else
      return (8);
  }

  async addPlayerToGame(player: Player) {
    if (this.isBeforFinalPlayer() === true) {
      this._players.push(player);
      //Notify all other players that a new player has joined? FLO
    }
    else if (this.isFinalPlayer() === true) {
      this._players.push(player);
      this.addMatchToDB();
      // start game
      //Notify all other players that a new player has joined? FLO
    }
    else {
      player.sendMessage("Match is full");
    }
  }

  private isBeforFinalPlayer(): boolean {
    return (this._players.length < this._numberOfPlayers - 1);
  }

  private isFinalPlayer(): boolean {
    return (this._players.length === this._numberOfPlayers - 1);
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



export type { GameOptions, Modifiers };
export default Match;
