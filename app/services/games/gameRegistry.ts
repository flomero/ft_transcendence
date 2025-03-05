import { promises as fs } from "fs";
import * as path from "path";

// Exported registry variable that will be populated on module load.
export let GAME_REGISTRY: Record<string, any> = {};

async function loadGameRegistry() {
  const jsonPath = path.join(__dirname, "game_registry.json");

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
    if (gameData.game_modes) {
      for (const mode in gameData.game_modes) {
        if (!gameData.game_modes.hasOwnProperty(mode)) continue;
        const modeData = gameData.game_modes[mode];
        if (modeData.class_name) {
          // Example: "./pong/game_modes/moded_multiplayer_pong"
          const modulePath = `./${game}/game_modes/${mode}`;
          try {
            const module = await import(modulePath);
            if (!module[modeData.class_name]) {
              throw new Error(
                `Module ${modulePath} does not export ${modeData.class_name}`,
              );
            }
            modeData.class = module[modeData.class_name];
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
    if (gameData.game_modifiers) {
      for (const modifier in gameData.game_modifiers) {
        if (!gameData.game_modifiers.hasOwnProperty(modifier)) continue;
        const modData = gameData.game_modifiers[modifier];
        if (modData.class_name) {
          // Example: "./pong/game_modifiers/black_hole_debuff_modifier"
          const modulePath = `./${game}/game_modifiers/${modifier}`;
          try {
            const modModule = await import(modulePath);
            if (!modModule[modData.class_name]) {
              throw new Error(
                `Module ${modulePath} does not export ${modData.class_name}`,
              );
            }
            modData.class = modModule[modData.class_name];
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
    if (gameData.power_ups) {
      for (const pu in gameData.power_ups) {
        if (!gameData.power_ups.hasOwnProperty(pu)) continue;
        const puData = gameData.power_ups[pu];
        if (puData.class_name) {
          // Example: "./pong/power_ups/black_hole_debuff_modifier"
          const modulePath = `./${game}/power_ups/${pu}`;
          try {
            const puModule = await import(modulePath);
            if (!puModule[puData.class_name]) {
              throw new Error(
                `Module ${modulePath} does not export ${puData.class_name}`,
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

// Automatically load the game registry when this module is imported.
async () => {
  await loadGameRegistry();
};
