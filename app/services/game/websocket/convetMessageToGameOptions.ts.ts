import { gameMessageInterface } from "../../../interfaces/game/gameMessageInterface";
import { GameOptions } from "./Match";

function convertMessageToGameOptions(message: gameMessageInterface): GameOptions {
	let gameOptions: GameOptions;
	switch (message.matchMode) {
		case "VanillaDouble":
			gameOptions = {
				match: message.match,
				matchMode: message.matchMode
			};
			break;
		case "ModdedDouble":
			gameOptions = {
				match: message.match,
				matchMode: message.matchMode,
				modifiers: message.modifiers
  return gameOptions;
}