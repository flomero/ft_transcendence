import { Rectangle } from "../../types/games/pong/rectangle";
import { Ball } from "../../types/games/pong/ball";

const EPSILON = 1e-2;

export interface Collision {
  distance: number;
  objectId: number;
  normal?: [number, number];
  type?: string;
}

export class PhysicsEngine {
  static detectCollision(
    ball: Ball,
    distance: number,
    objects: Array<Rectangle | Ball | Record<string, any>>,
    objectType: string,
  ): Collision | null {
    let closestCollision: Collision | null = null;

    for (let i = 0; i < objects.length; i++) {
      if (!objects[i].isVisible) {
        continue;
      }

      let collision: Collision | null;
      if (objectType !== "powerUp") {
        collision = PhysicsEngine.ballRectCollision(
          ball,
          distance,
          objects[i] as Rectangle,
          i,
        );
      } else {
        // Balls that can't score a goal can't pickup powerUps
        if (!ball.doGoal) continue;

        collision = PhysicsEngine.ballCircleCollision(
          ball,
          distance,
          objects[i] as Ball,
          i,
        );
      }

      if (
        collision &&
        (!closestCollision || collision.distance < closestCollision.distance)
      ) {
        collision.objectId = i;
        collision.type = objectType;
        closestCollision = collision;
      }
    }

    return closestCollision;
  }

  static ballRectCollision(
    ball: Ball,
    distance: number,
    obj: Rectangle,
    objId: number,
  ): Collision | null {
    const rx = obj.x;
    const ry = obj.y;
    const rdx = obj.dx;
    const rdy = obj.dy;
    const rw = obj.width;
    const rh = obj.height;
    // alpha is the angle of the wall's (or paddle's) direction
    const alpha = rdx !== 0 ? Math.atan2(rdy, rdx) : (rdy * Math.PI) / 2.0;

    const bx = ball.x;
    const by = ball.y;
    const bdx = ball.dx;
    const bdy = ball.dy;
    const br = ball.radius;
    const bs = distance;

    // Transform ball properties into the object's local (rotated) coordinate system
    const dx = bx - rx;
    const dy = by - ry;
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);
    // local ball position
    const r_bx = dx * ca + dy * sa;
    const r_by = -dx * sa + dy * ca;
    // local ball direction
    const r_bdx = bdx * ca + bdy * sa;
    const r_bdy = -bdx * sa + bdy * ca;

    // Deactivate collision from inside the Rectangle
    if (
      r_bx > -rw / 2.0 &&
      r_bx < rw / 2.0 &&
      r_by > -rh / 2.0 &&
      r_by < rh / 2.0
    )
      return null;

    // First, check for side collisions
    const potentialTs: Array<[number, null]> = [];
    const tx_1 =
      Math.abs(r_bdx) >= EPSILON ? (br + rw / 2.0 - r_bx) / r_bdx : null;
    const tx_2 =
      Math.abs(r_bdx) >= EPSILON ? (-br - rw / 2.0 - r_bx) / r_bdx : null;
    const ty_1 =
      Math.abs(r_bdy) >= EPSILON ? (br + rh / 2.0 - r_by) / r_bdy : null;
    const ty_2 =
      Math.abs(r_bdy) >= EPSILON ? (-br - rh / 2.0 - r_by) / r_bdy : null;

    for (const tCandidate of [tx_1, tx_2, ty_1, ty_2]) {
      if (tCandidate !== null && EPSILON < tCandidate && tCandidate <= bs) {
        // Additionally check that the ball's position at time t_candidate is within the extended rectangle bounds
        const new_r_bx = r_bx + tCandidate * r_bdx;
        const new_r_by = r_by + tCandidate * r_bdy;
        if (
          Math.abs(new_r_bx) <= rw / 2.0 + br + EPSILON &&
          Math.abs(new_r_by) <= rh / 2.0 + br + EPSILON
        ) {
          potentialTs.push([tCandidate, null]); // normal will be computed below
        }
      }
    }

    // Determine the earliest side collision time (if any)
    let sideCollisionT = Infinity;
    for (const [t] of potentialTs) {
      if (t < sideCollisionT) {
        sideCollisionT = t;
      }
    }

    // Now add the corner collision check
    // Define the four corners in the object's local space
    const corners: Array<[number, number]> = [
      [rw / 2.0, rh / 2.0],
      [-rw / 2.0, rh / 2.0],
      [-rw / 2.0, -rh / 2.0],
      [rw / 2.0, -rh / 2.0],
    ];

    let cornerCollisionT = Infinity;
    let cornerNormalLocal: [number, number] | null = null; // Will store the local normal for the earliest corner collision

    for (const [cx, cy] of corners) {
      // Solve for t in: (r_bx + t*r_bdx - cx)^2 + (r_by + t*r_bdy - cy)^2 = br^2
      const A = r_bdx ** 2 + r_bdy ** 2; // should be 1 if normalized
      const B = 2 * ((r_bx - cx) * r_bdx + (r_by - cy) * r_bdy);
      const C = (r_bx - cx) ** 2 + (r_by - cy) ** 2 - br ** 2;
      const discriminant = B ** 2 - 4 * A * C;

      if (discriminant < 0) {
        continue; // no real intersection with this corner
      }

      const sqrtDisc = Math.sqrt(discriminant);
      // We choose the smaller positive t
      const tCandidate = (-B - sqrtDisc) / (2 * A);

      if (EPSILON < tCandidate && tCandidate <= bs) {
        // Check if this candidate is the earliest among corner collisions
        if (tCandidate < cornerCollisionT) {
          cornerCollisionT = tCandidate;
          // Compute the collision point in local coordinates
          const collisionX = r_bx + tCandidate * r_bdx;
          const collisionY = r_by + tCandidate * r_bdy;
          // Local normal is from the corner to the collision point
          const normalLocalX = collisionX - cx;
          const normalLocalY = collisionY - cy;
          const normLength = Math.sqrt(normalLocalX ** 2 + normalLocalY ** 2);

          if (normLength > EPSILON) {
            cornerNormalLocal = [
              normalLocalX / normLength,
              normalLocalY / normLength,
            ];
          } else {
            cornerNormalLocal = [0, 0]; // fallback; ideally should not happen
          }
        }
      }
    }

    // Now determine which collision (side or corner) happens first
    let minT: number;
    let normalGlobal: [number, number];

    if (cornerCollisionT < sideCollisionT) {
      minT = cornerCollisionT;
      // Convert the local normal back to global coordinates using the inverse rotation
      const [nlx, nly] = cornerNormalLocal!;
      normalGlobal = [nlx * ca - nly * sa, nlx * sa + nly * ca];
    } else if (potentialTs.length > 0) {
      // For a side collision, we must decide which side was hit
      // Use the ball position at time minT to choose a normal consistent with the side
      minT = sideCollisionT;
      const posLocalX = r_bx + minT * r_bdx;
      const posLocalY = r_by + minT * r_bdy;

      let normalLocal: [number, number];

      // Determine which side is penetrated
      if (posLocalX >= rw / 2.0) {
        // Right side: the local normal is along +x
        normalLocal = [1, 0];
      } else if (posLocalX <= -rw / 2.0) {
        normalLocal = [-1, 0];
      } else if (posLocalY >= rh / 2.0) {
        normalLocal = [0, 1];
      } else {
        // posLocalY <= -rh/2.0
        normalLocal = [0, -1];
      }

      normalGlobal = [
        normalLocal[0] * ca - normalLocal[1] * sa,
        normalLocal[0] * sa + normalLocal[1] * ca,
      ];
    } else {
      // No collision detected
      return null;
    }

    return { distance: minT, normal: normalGlobal, objectId: objId };
  }

  static computeCollision(
    t: number,
    r_bx: number,
    r_by: number,
    r_bdx: number,
    r_bdy: number,
    rw: number,
    rh: number,
    objId: number,
  ): Collision {
    const intersectionX = r_bx + t * r_bdx;
    const intersectionY = r_by + t * r_bdy;

    let normal: [number, number];

    if (Math.abs(intersectionX) <= rw / 2.0) {
      normal = intersectionY > 0 ? [0, 1] : [0, -1];
    } else if (Math.abs(intersectionY) <= rh / 2.0) {
      normal = intersectionX > 0 ? [1, 0] : [-1, 0];
    } else {
      const normalX =
        intersectionX - (intersectionX > 0 ? rw / 2.0 : -rw / 2.0);
      const normalY =
        intersectionY - (intersectionY > 0 ? rh / 2.0 : -rh / 2.0);
      const normLength = Math.sqrt(normalX ** 2 + normalY ** 2);
      normal = [normalX / normLength, normalY / normLength];
    }

    return { distance: t, normal, objectId: objId };
  }

  static resolveCollision(ball: Ball, collision: Collision): void {
    const normal = collision.normal!;

    // Compute reflection
    const dotProduct = 2 * (ball.dx * normal[0] + ball.dy * normal[1]);
    ball.dx -= dotProduct * normal[0];
    ball.dy -= dotProduct * normal[1];

    // Normalize direction
    const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
    ball.dx /= speed;
    ball.dy /= speed;

    // Move the ball slightly outside the collision surface to prevent sticking
    ball.x += normal[0] * EPSILON * 10;
    ball.y += normal[1] * EPSILON * 10;
  }

  static ballCircleCollision(
    ball: Ball,
    distance: number,
    obj: Ball,
    objId: number,
  ): Collision | null {
    const a = ball.dx ** 2 + ball.dy ** 2;
    const b = 2.0 * (ball.dx * (ball.x - obj.x) + ball.dy * (ball.y - obj.y));
    const c =
      ball.x ** 2 +
      obj.x ** 2 -
      2.0 * ball.x * obj.x +
      (ball.y ** 2 + obj.y ** 2 - 2.0 * ball.y * obj.y) -
      (ball.radius ** 2 + obj.radius ** 2);

    const delta = b ** 2 - 4.0 * a * c;
    if (delta < 0) {
      return null;
    }

    const sqrtDelta = Math.sqrt(delta);
    const t = (-b - sqrtDelta) / (2.0 * a);

    if (EPSILON < t && t <= distance) {
      return { distance: t, objectId: objId };
    }

    return null;
  }
}

export default PhysicsEngine;
