interface Options {
  type: string | null;
  playerId: number;
  timestamp: number;
}

interface GameMessage {
  type: "userInput";
  options: Options;
}

export default GameMessage;
