import { IUserSampler } from "../../../types/strategy/IUserSampler";
import { RNG } from "../../games/rng";

export class Random implements IUserSampler {
  name = "random";

  sampleUser(userIDs: string[]): string {
    if (userIDs.length === 0) return "";

    const rng = new RNG();
    return userIDs[rng.randomInt(0, userIDs.length - 1)];
  }
}
