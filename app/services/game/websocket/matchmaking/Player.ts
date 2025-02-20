import WebSocket from "ws";
import { Database } from 'sqlite';

type States = "WaitingForMessage" | "InGameLobby" | "PlayingGame";

class Player {
  private _playerId: string;
  private _socketConnection: WebSocket;
  //private _userName:string;
  private _dbConnection: Database;
  _currentState: States;


  constructor(playerId: string, socketConnection: WebSocket, dbConnection: Database) {
    this._playerId = playerId;
    this._socketConnection = socketConnection;
    this._currentState = "WaitingForMessage";
    this._dbConnection = dbConnection;
    //this._userName = this.getUserNameFromDB();
  }

  sendMessage(message: string) {
    this._socketConnection.send(message);
  }

//  private async getUserNameFromDB(): Promise<string> {
//    const sql = `SELECT username FROM users WHERE id = ?`;
//    const row = await this._dbConnection.get(sql, [this._playerId]);
//    if (!row || typeof row.username !== "string") {
//      throw new Error("User not found in database");
//    }
//    return row.username;
//  }

 // get userName(){
 //   return this._userName;
 // }

  get databaseConnection(){
    return this._dbConnection;
  }
}

export default Player;
