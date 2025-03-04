type MatchOptions =
  | { match: "pong"; matchMode: "VanillaDouble" }
  | { match: "pong"; matchMode: "ModdedDouble"; modifiers: Modifiers[] }
  | { match: "pong"; matchMode: "VanillaMulti" }
  | { match: "pong"; matchMode: "ModdedMulti"; modifiers: Modifiers[] };

type Modifiers = "blackwhole" | "speedUpBall";

export type { MatchOptions, Modifiers };
