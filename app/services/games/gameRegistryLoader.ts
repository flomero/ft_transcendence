import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  type GameRegistry,
  GAME_REGISTRY,
} from "../../types/games/gameRegistry";

export async function loadGameRegistry(): Promise<void> {
  const jsonPath = path.resolve(__dirname, "../../../gameRegistry.json");

  let jsonData: string;
  try {
    jsonData = await fs.readFile(jsonPath, "utf-8");
  } catch (err) {
    throw new Error(`Game registry JSON not found at ${jsonPath}`);
  }

  // Parse the JSON file
  const registry = JSON.parse(jsonData) as GameRegistry;

  // Loop through each game in the registry.
  for (const game in registry) {
    if (!registry.hasOwnProperty(game)) continue;
    const gameData = registry[game];

    // Process game modes.
    if (gameData.gameModes) {
      for (const mode in gameData.gameModes) {
        if (!gameData.gameModes.hasOwnProperty(mode)) continue;
        const modeData = gameData.gameModes[mode];
        if (modeData.className) {
          const modulePath = `./${game}/gameModes/${mode}.js`;
          try {
            const module = await import(modulePath);
            if (!module[modeData.className]) {
              throw new Error(
                `Module ${modulePath} does not export ${modeData.className}`,
              );
            }
            modeData.class = module[modeData.className];
          } catch (err) {
            console.error(
              `Error importing game mode "${mode}" for game "${game}":`,
              err,
            );
          }
        }
      }
    }

    // Process game modifiers.
    if (gameData.gameModifiers) {
      for (const modifier in gameData.gameModifiers) {
        if (!gameData.gameModifiers.hasOwnProperty(modifier)) continue;
        const modData = gameData.gameModifiers[modifier];
        if (modData.className) {
          const modulePath = `./${game}/gameModifiers/${modifier}.js`;
          try {
            const modModule = await import(modulePath);
            if (!modModule[modData.className]) {
              throw new Error(
                `Module ${modulePath} does not export ${modData.className}`,
              );
            }
            modData.class = modModule[modData.className];
          } catch (err) {
            console.error(
              `Error importing game modifier "${modifier}" for game "${game}":`,
              err,
            );
          }
        }
      }
    }

    // Process power ups.
    if (gameData.powerUps) {
      for (const pu in gameData.powerUps) {
        if (!gameData.powerUps.hasOwnProperty(pu)) continue;
        const puData = gameData.powerUps[pu];
        if (puData.className) {
          const modulePath = `./${game}/powerUps/${pu}.js`;
          try {
            const puModule = await import(modulePath);
            if (!puModule[puData.className]) {
              throw new Error(
                `Module ${modulePath} does not export ${puData.className}`,
              );
            }
            // Fixed the bug in your original code: was using puData.class_name but should be puData.className
            puData.class = puModule[puData.className];
          } catch (err) {
            console.error(
              `Error importing power up "${pu}" for game "${game}":`,
              err,
            );
          }
        }
      }
    }
  }

  // Save the processed registry to the exported variable.
  Object.assign(GAME_REGISTRY, registry);
  console.log("Loaded GAME_REGISTRY:", GAME_REGISTRY);
}
