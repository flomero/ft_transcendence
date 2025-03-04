import Player from "./Player";
import { Database } from "sqlite";
import { randomUUID } from "crypto";
import { MatchOptions } from "../../../types/game/MatchOptions";

class Match {
  private _matchId: string = randomUUID();
  private _gameOptions: MatchOptions;
  private _players: Player[] = [];
  private _numberOfPlayers: number = 0;
  private _connectionToDB: Database;
  private _matchStatus: "waiting" | "playing" | "finished" = "waiting";

  constructor(gameOptions: MatchOptions, dbConneection: Database) {
    this._gameOptions = gameOptions;
    this._numberOfPlayers = this.setNumberOfPlayers(gameOptions);
    this._connectionToDB = dbConneection;
    this._matchStatus = "waiting";
  }

  private setNumberOfPlayers(gameOptions: MatchOptions): number {
    if (gameOptions.matchMode.includes("Modded") === false) return 2;
    else return 8;
  }

  async addPlayerToGame(player: Player) {
    if (this.canPlayerBeAdded(player) === false)
      throw new Error("Player can't be added to game");
    else if (this.isBeforFinalPlayer() === true) this.registerPlayer(player);
    else if (this.isFinalPlayer() === true) {
      this.registerPlayer(player);
      await this.startGame();
    } else {
      player.sendMessage("Match is full");
    }
  }

  private canPlayerBeAdded(player: Player): boolean {
    if (this._matchStatus !== "waiting") return false;
    else if (this.isAddedAlready(player) === true) return false;
    else if (this.isGameFull() == true) return false;
    else if (player.currentState !== "WaitingForMessage") return false;
    return true;
  }

  private isAddedAlready(player: Player): boolean {
    if (this._players.includes(player) === true) return true;
    return false;
  }

  private sendMatchIdToPlayer(player: Player) {
    player.sendMessage("matchId: " + this.matchId);
  }

  private registerPlayer(player: Player) {
    player.currentState = "InGameLobby";
    this._players.push(player);
    this.sendMatchIdToPlayer(player);
  }

  private isBeforFinalPlayer(): boolean {
    return this._players.length < this._numberOfPlayers - 1;
  }

  private isFinalPlayer(): boolean {
    return this._players.length === this._numberOfPlayers - 1;
  }

  async startGame(): Promise<void> {
    //await this.addMatchToDB();
    //await this.addPlayersToMatchInDB();
    this._matchStatus = "playing";
    // start louens game
  }

  async addMatchToDB(): Promise<void> {
    // make private
    if (!this._connectionToDB) return;
    const sql = `
    INSERT INTO matches (id, game, gameMode)
    VALUES (?, ?, ?)
    `;
    await this._connectionToDB.run(sql, [
      this._matchId,
      "Pong",
      this._gameOptions.matchMode,
    ]);
  }

  async addPlayersToMatchInDB(): Promise<void> {
    // make private
    if (!this._connectionToDB) return;
    const sql = `
    INSERT INTO r_users_matches (id, userId, match)
    VALUES (?, ?, ?)
    `;
    this._players.forEach(async (player) => {
      await this._connectionToDB.run(sql, [
        randomUUID,
        player.playerId,
        this._matchId,
      ]);
    });
  }

  //matchInput(input: string, timeStamp: number) {
  //  //send message to Louens game
  // }

  sendMessageToAllPlayers(message: string) {
    this._players.forEach((player) => {
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
    return this._players.length === this._numberOfPlayers;
  }

  private getPlayerNameAndId(): string {
    return this._players
      .map(
        (player) =>
          `PlayerId: ${player.playerId}, PlayerName: ${player.userName}`,
      )
      .join("\n");
  }

  public printGameStats() {
    const message =
      "MatchId: " +
      this._matchId +
      "\n" +
      " MatchOptions: " +
      JSON.stringify(this._gameOptions) +
      "\n" +
      " Players:\n" +
      this.getPlayerNameAndId() +
      "\n" +
      " NumberOfPlayers: " +
      this._numberOfPlayers +
      "\n" +
      " GameStatus: " +
      this._matchStatus +
      "\n";
    console.log(message);
  }
}

export default Match;
