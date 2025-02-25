import WebSocket from "ws";

export type States = "WaitingForMessage" | "InGameLobby" | "PlayingGame";

class Player {
  private _playerId: string;
  private _socketConnection: WebSocket;
  private _userName:string = "unknown";
  private _currentState: States;


  constructor(playerId: string, socketConnection: WebSocket, userName: string) {
    this._playerId = playerId;
    this._socketConnection = socketConnection;
    this._userName = userName;
    this._currentState = "WaitingForMessage";
  }

  sendMessage(message: string) {
    this._socketConnection.send(message);
  }

  get userName() {
    return this._userName;
  }

  get playerId() {
    return this._playerId;
  }

  set currentState(newState: States) {
    this._currentState = newState;
  }

  get currentState() {
    return this._currentState;
  }
}

export default Player;
