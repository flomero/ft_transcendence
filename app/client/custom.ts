import type Router from "./router.js";

declare global {
  interface Window {
    router: Router;
    customFormHandler: {
      handleFormSubmit: (event: Event) => void;
    };
  }
}

/**
 * Toggles game mode settings visibility based on the selected game mode.
 */
function setupGameModeToggle(): void {
  const gameModeRadios = document.querySelectorAll<HTMLInputElement>(
    'input[name="gameModeType"]',
  );

  gameModeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      document
        .querySelectorAll<HTMLElement>(".game-mode-settings")
        .forEach((section) => {
          section.classList.add("hidden");
        });

      const selectedSettings = document.getElementById(`${this.value}Settings`);
      if (selectedSettings) {
        selectedSettings.classList.remove("hidden");
      }
    });
  });
}

/**
 * Toggles power-up configuration visibility based on the selected power-ups.
 */
function setupPowerUpToggle(): void {
  const powerupToggles =
    document.querySelectorAll<HTMLInputElement>(".powerup-toggle");

  powerupToggles.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      const configSection = document.getElementById(
        `${this.id.replace("Enabled", "")}Config`,
      );
      if (configSection) {
        configSection.classList.toggle("hidden", !this.checked);
      }
    });

    // Initialize visibility on page load
    const configSection = document.getElementById(
      `${toggle.id.replace("Enabled", "")}Config`,
    );
    if (configSection) {
      configSection.classList.toggle("hidden", !toggle.checked);
    }
  });
}

/**
 * Initializes the form logic for both `contentLoaded` and `DOMContentLoaded` events.
 */
function initializeFormLogic(): void {
  setupGameModeToggle();
  setupPowerUpToggle();
}

// Attach event listeners for both `contentLoaded` and `DOMContentLoaded`
document.addEventListener("contentLoaded", initializeFormLogic);
document.addEventListener("DOMContentLoaded", initializeFormLogic);

/**
 * Custom form handler object to handle form submission.
 */
window.customFormHandler = {
  handleFormSubmit(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const selectedGameModeType = document.querySelector<HTMLInputElement>(
      'input[name="gameModeType"]:checked',
    )?.value;

    const gameSettings: Record<string, any> = {
      gameName: formData.get("gameName"),
      gameModeName: formData.get("gameModeName"),
      playerCount: Number(formData.get("playerCount")),
      gameModeConfig: {
        powerUpCapacities: {},
      },
      modifierNames: {
        powerUpSpawner: {
          meanDelayS:
            Number(formData.get("modifierNames.powerUpSpawner.meanDelayS")) ||
            5,
          delaySpanS:
            Number(formData.get("modifierNames.powerUpSpawner.delaySpanS")) ||
            2,
          positionSamplerStrategyName:
            formData.get(
              "modifierNames.powerUpSpawner.positionSamplerStrategyName",
            ) || "uniformArena",
        },
        goalReset: {},
        paceBreaker: {
          noResetThresholdS: 10,
          noPaddleBounceThreshold: 10,
          twoPaddlesBounceThreshold: 7,
          onePaddleBounceThreshold: 14,
        },
      },
      powerUpNames: {},
    };

    if (selectedGameModeType === "timedGame") {
      gameSettings.modifierNames.timedGame = {};
    } else if (selectedGameModeType === "scoredGame") {
      gameSettings.modifierNames.scoredGame = {};
    } else if (selectedGameModeType === "survivalGame") {
      gameSettings.modifierNames.survivalGame = [];
      gameSettings.modifierNames.elimination = {};

      if (formData.get("enableArenaShrink")) {
        gameSettings.modifierNames.arenaShrink = [];
      }
    }

    const speedBoostEnabled = document.getElementById(
      "speedBoostEnabled",
    ) as HTMLInputElement;
    if (speedBoostEnabled?.checked) {
      gameSettings.powerUpNames.speedBoost = {};
      gameSettings.gameModeConfig.powerUpCapacities = {
        speedBoost:
          Number(formData.get("gameModeConfig.powerUpCapacities.speedBoost")) ||
          1.5,
      };
    }

    for (const [key, value] of formData.entries()) {
      if (
        key === "gameName" ||
        key === "gameModeName" ||
        key === "playerCount" ||
        key === "gameModeType" ||
        key === "enableArenaShrink" ||
        key.startsWith("powerUpEnabled")
      ) {
        continue;
      }

      if (
        (key.startsWith("modifierNames.timedGame") &&
          selectedGameModeType !== "timedGame") ||
        (key.startsWith("modifierNames.scoredGame") &&
          selectedGameModeType !== "scoredGame") ||
        ((key.startsWith("modifierNames.survivalGame") ||
          key.startsWith("modifierNames.elimination")) &&
          selectedGameModeType !== "survivalGame") ||
        (key.startsWith("modifierNames.arenaShrink") &&
          (selectedGameModeType !== "survivalGame" ||
            !formData.get("enableArenaShrink")))
      ) {
        continue;
      }

      if (
        key.startsWith("powerUpNames.speedBoost") &&
        !speedBoostEnabled?.checked
      ) {
        continue;
      }

      if (key.includes(".")) {
        const parts = key.split(".");
        let current = gameSettings;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (typeof current !== "object" || current === null) {
            break;
          }

          if (!(part in current)) {
            current[part] = isNaN(Number(parts[i + 1])) ? {} : [];
          }

          current = current[part];
        }

        if (typeof current === "object" && current !== null) {
          const lastKey = parts[parts.length - 1];
          if (value === "true") {
            current[lastKey] = true;
          } else if (value === "false") {
            current[lastKey] = false;
          } else if (!isNaN(value as any) && value !== "") {
            current[lastKey] = Number(value);
          } else {
            current[lastKey] = value;
          }
        }
      }
    }

    console.log("Game settings:", gameSettings);

    fetch("/games/lobby/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameSettings),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.message || "Network response was not ok");
          });
        }
        return response.json();
      })
      .then((data) => {
        window.router.navigateTo(`/games/lobby/join/${data.lobbyId}`);
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error creating lobby: " + error.message);
      });
  },
};
