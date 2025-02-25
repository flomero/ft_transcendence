import Player from './Player';
import { Database } from 'sqlite';
import { randomUUID } from 'crypto';

class Match {
  private _matchId: string = randomUUID();
  private _gameOptions: GameOptions;
  private _players: Player[] = [];
  private _numberOfPlayers: number = 0;
  private _connectionToDB: Database;
  private _gameStatus: "waiting" | "playing" | "finished" = "waiting";


  constructor(gameOptions: GameOptions, dbConneection: Database) {
    this._gameOptions = gameOptions;
    this._numberOfPlayers = this.setNumberOfPlayers(gameOptions);
    this._connectionToDB = dbConneection;
    this._gameStatus = "waiting";
  }

  private setNumberOfPlayers(gameOptions: GameOptions): number {
    if (gameOptions.gameType.includes("Modded") === false)
      return (2);
    else
      return (8);
  }

  async addPlayerToGame(player: Player) {
    if (this.canPlayerBeAdded(player) === false)
      throw new Error("Player can't be added to game");
    else if (this.isBeforFinalPlayer() === true)
      this.registerPlayer(player);
    else if (this.isFinalPlayer() === true) {
      this.registerPlayer(player);
      await this.startGame();
    }
    else {
      player.sendMessage("Match is full");
    }
  }

  private canPlayerBeAdded(player: Player): boolean {
    if (this._gameStatus !== "waiting")
      return (false);
    else if (this.isAddedAlready(player) === true)
      return (false);
    else if (this.isGameFull() == true)
      return (false);
    else if (player.currentState !== "WaitingForMessage" )
      return (false);
    return (true);
  }

  private isAddedAlready(player: Player): boolean {
    if (this._players.includes(player) === true)
      return (true);
    return (false);
  }

  private sendMatchIdToPlayer(player: Player) {
    player.sendMessage("matchId: " + this.matchId);
  }

  private registerPlayer(player: Player) {
    player.currentState= "InGameLobby";
    this._players.push(player);
    this.sendMatchIdToPlayer(player);
  }

  private isBeforFinalPlayer(): boolean {
    return (this._players.length < this._numberOfPlayers - 1);
  }

  private isFinalPlayer(): boolean {
    return (this._players.length === this._numberOfPlayers - 1);
  }

  async startGame(): Promise<void> {
    //await this.addMatchToDB();
    //await this.addPlayersToMatchInDB();
    this._gameStatus = "playing";
    // start louens game
  }

  async addMatchToDB(): Promise<void> { // make private
    if (!this._connectionToDB)
      return;
    const sql = `
    INSERT INTO matches (id, game, gameMode)
    VALUES (?, ?, ?)
    `;
    await this._connectionToDB.run(sql, [
      this._matchId, "Pong", this._gameOptions.gameType]);
  }

  async addPlayersToMatchInDB(): Promise<void> { // make private
    if (!this._connectionToDB)
      return;
    const sql = `
    INSERT INTO r_users_matches (id, userId, match)
    VALUES (?, ?, ?)
    `;
    this._players.forEach(async player => {
      await this._connectionToDB.run(sql,
                      [randomUUID, player.playerId, this._matchId]);
    });
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

  private getPlayerNameAndId(): string {
  return this._players
    .map(player => `PlayerId: ${player.playerId}, PlayerName: ${player.userName}`)
    .join("\n");
  }

  public printGameStats() {
  const message = "MatchId: " + this._matchId + "\n"
    + " GameOptions: " + JSON.stringify(this._gameOptions) + "\n"
    + " Players:\n" + this.getPlayerNameAndId() + "\n"
    + " NumberOfPlayers: " + this._numberOfPlayers + "\n"
    + " GameStatus: " + this._gameStatus + "\n";
  console.log(message);
  }

}

type GameOptions =
  { gameMode: 'pong'; gameType: 'VanillaDouble'; }
  | { gameMode: 'pong'; gameType: 'ModdedDouble'; modifiers: Modifiers[] }
  | { gameMode: 'pong'; gameType: 'VanillaMulti'; }
  | { gameMode: 'pong'; gameType: 'ModdedMulti'; modifiers: Modifiers[] };

        type Modifiers = "blackwhole" | "speedUpBall";


export type { GameOptions, Modifiers };
export default Match;
