import type { Collision } from "../../../services/games/physicsEngine";

export interface ExtendedCollisionData {
  tick: number;
  collisionPos: { x: number; y: number };
  collision: Collision;
}
