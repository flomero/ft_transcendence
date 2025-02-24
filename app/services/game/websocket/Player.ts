// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Player.ts                                          :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: fgabler <marvin@42.fr>                     +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/02/24 14:04:45 by fgabler           #+#    #+#             //
//   Updated: 2025/02/24 16:16:33 by fgabler          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import WebSocket from "ws";

//type States = "WaitingForMessage" | "InGameLobby" | "PlayingGame";

class Player {
  private _playerId: string;
  private _socketConnection: WebSocket;
  private _userName:string = "unknown";
 // private _currentState: States;


  constructor(playerId: string, socketConnection: WebSocket, userName: string) {
    this._playerId = playerId;
    this._socketConnection = socketConnection;
    this._userName = userName;
//    this._currentState = "WaitingForMessage";
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

  //set currentState(newState: States) {
   // this._currentState = newState;
 // }
}

export default Player;
