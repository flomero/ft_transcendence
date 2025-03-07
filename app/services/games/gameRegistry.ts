import { promises as fs } from "fs";
import * as path from "path";

// Exported registry variable that will be populated on module load.
export let GAME_REGISTRY: Record<string, any> = {};

export async function loadGameRegistry() {
  const jsonPath = path.join(
    "/workspaces/ft_transcendence/app/gameRegistry.json",
  );

  let jsonData: string;
  try {
    jsonData = await fs.readFile(jsonPath, "utf-8");
  } catch (err) {
    throw new Error(`Game registry JSON not found at ${jsonPath}`);
  }

  // Parse the JSON file (assumed to follow a strict format)
  const registry = JSON.parse(jsonData);

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
          // Example: "./pong/gameModifiers/black_hole_debuff_modifier"
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
          // Example: "./pong/powerUps/black_hole_debuff_modifier"
          const modulePath = `./${game}/powerUps/${pu}.js`;
          try {
            const puModule = await import(modulePath);
            if (!puModule[puData.className]) {
              throw new Error(
                `Module ${modulePath} does not export ${puData.className}`,
              );
            }
            puData.class = puModule[puData.class_name];
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
  GAME_REGISTRY = registry;
  console.log("Loaded GAME_REGISTRY:", GAME_REGISTRY);
}
