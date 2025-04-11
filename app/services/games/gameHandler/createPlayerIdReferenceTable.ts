import GameManager from "./GameManager";

const createPlayerIdReferenceTable = (gameManager: GameManager): string => {
  const playerIdReferenceTable: Array<{
    playerUUID: string;
    playerGameID: string;
  }> = [];

  for (const player of gameManager.getPlayersAsArray) {
    playerIdReferenceTable.push({
      playerUUID: player.playerUUID,
      playerGameID: player.id.toString(),
    });
  }

  for (const ai of gameManager.getAiopponent.values()) {
    playerIdReferenceTable.push({
      playerUUID: ai.getUUID(),
      playerGameID: ai.getId().toString(),
    });
  }

  return JSON.stringify(playerIdReferenceTable);
};

export default createPlayerIdReferenceTable;
