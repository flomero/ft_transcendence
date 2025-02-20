import WebSocket from "ws";

type States = "CONNECTED";

class Player {
  private _playerId: string;
  _currentState: States;
  _socketConnection: WebSocket;


  constructor(playerId: string, socketConnection: WebSocket, currentState: States) {
    this._playerId = playerId;
    this._currentState = currentState;
    this._socketConnection = socketConnection;
  }
}
