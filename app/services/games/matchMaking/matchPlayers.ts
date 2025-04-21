import { matchMakingManager } from "./MatchMakingManager";
import { createMatch } from "./createMatch";
import type { Database } from "sqlite";
import { GAMEMODE_REGISTRY, MatchmakingGameModes } from "../../../config";

const matchPlayers = async (db: Database): Promise<void> => {
  // Group members by game mode
  const gameModeGroups = new Map<string, string[]>();

  // Populate game mode groups
  matchMakingManager.getAllMembers().forEach((member) => {
    const gameMode = member.gameMode || MatchmakingGameModes.ClassicPong;
    if (!gameModeGroups.has(gameMode)) {
      gameModeGroups.set(gameMode, []);
    }
    gameModeGroups.get(gameMode)?.push(member.memberId);
  });

  // Match players for each game mode
  for (const [gameMode, players] of gameModeGroups.entries()) {
    const requiredPlayerCount =
      GAMEMODE_REGISTRY[gameMode as keyof typeof GAMEMODE_REGISTRY]
        ?.playerCount || 2;

    while (players.length >= requiredPlayerCount) {
      const matchedPlayers = players.splice(0, requiredPlayerCount);
      await matchPlayersForGame(matchedPlayers, gameMode, db);
    }
  }
};

const matchPlayersForGame = async (
  playerIds: string[],
  gameMode: string,
  db: Database,
): Promise<void> => {
  const matchId = await createMatch(playerIds, gameMode, db);

  playerIds.forEach((playerId) => {
    matchMakingManager.sendMessageToMember(
      playerId,
      JSON.stringify({ type: "matchFound", data: matchId }),
    );
  });

  playerIds.forEach((playerId) => {
    if (matchMakingManager.memberExists(playerId)) {
      matchMakingManager.removeMember(playerId);
    }
  });
};

export default matchPlayers;
