import type { Database } from "sqlite";
import { gameManagers } from "../lobby/start/startLobbyHandler";

const saveGameResultInDb = async (gameManagerId: string, db: Database) => {
  const gameManager = gameManagers.get(gameManagerId);

  if (gameManager === undefined)
    throw new Error(`Game manager with ID ${gameManagerId} not found`);

  const gameScores = gameManager.getScores;
  const players = gameManager.getPlayersAsArray;
  const query = `UPDATE r_users_matches SET score = ? WHERE userId = ? AND matchId = ?`;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const score = gameScores[i];

    try {
      db.run(query, [score, player.playerUUID, gameManager.getId]);
    } catch (err) {
      if (err instanceof Error)
        console.error("Error updating score:", err.message);
    }
  }
};

export default saveGameResultInDb;
