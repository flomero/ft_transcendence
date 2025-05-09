import type { Rectangle } from "../../types/games/pong/rectangle";
import type { Ball } from "../../types/games/pong/ball";

const EPSILON = 1e-2;

export interface OutOfBoundsCollision {
  position: [number, number];
}

export interface Collision {
  distance: number;
  objectId: number;
  normal?: [number, number];
  type?: string;
  outOfBounds?: OutOfBoundsCollision; // New flag to indicate out-of-bounds correction
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
      if (!objects[i] || !objects[i].doCollision) {
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
        (!closestCollision ||
          collision.distance < closestCollision.distance ||
          collision.outOfBounds)
      ) {
        collision.objectId = i;
        collision.type = objectType;
        closestCollision = collision;

        // If we found an out-of-bounds situation, return it immediately
        if (collision.outOfBounds) {
          return closestCollision;
        }
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
    const rdx = obj.dx;
    const rdy = obj.dy;
    const rw = obj.width;
    const rh = obj.height;
    // alpha is the angle of the wall's (or paddle's) direction
    const alpha = rdx !== 0 ? Math.atan2(rdy, rdx) : (rdy * Math.PI) / 2.0;

    const bs = distance;

    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);

    const transformedBall = PhysicsEngine.transformIntoBase(ball, obj);

    if (obj.doBoundsProtection) {
      const possibleInBoundsCollision = PhysicsEngine.resolveBallInsideObject(
        ball,
        obj,
        objId,
        [ball.dx, ball.dy],
        true,
      );
      if (possibleInBoundsCollision) return possibleInBoundsCollision;
    }

    // Check if the ball is inside the Rectangle (out of bounds)
    // if (
    //   transformedBall.x >= -rw / 2.0 - EPSILON &&
    //   transformedBall.x <= rw / 2.0 + EPSILON &&
    //   transformedBall.y >= -rh / 2.0 - EPSILON &&
    //   transformedBall.y <= rh / 2.0 + EPSILON
    // ) {
    //   console.log(`\nball in object: ${objId}`);
    //   console.log(`Ball pos in object's base:`);
    //   console.log(`  |- x: ${transformedBall.x}`);
    //   console.log(`  |- y: ${transformedBall.y}`);

    //   // Required distance to move the ball out (along the normal)
    //   const distanceToMove = obj.height - transformedBall.y + Math.PI * EPSILON;

    //   // Use original normal in global space
    //   const normalGlobal: [number, number] = [obj.nx, obj.ny];

    //   const newX = transformedBall.x + distanceToMove * obj.nx;
    //   const newY = transformedBall.y + distanceToMove * obj.ny;
    //   const newRBX = (newX - rx) * ca + (newY - ry) * sa;
    //   const newRBY = -(newX - rx) * sa + (newY - ry) * ca;

    //   console.log(`After resolution position:`);
    //   console.log(`  |- x: ${newRBX}`);
    //   console.log(`  |- y: ${newRBY}`);

    //   return {
    //     distance: distanceToMove,
    //     objectId: objId,
    //     normal: normalGlobal,
    //     outOfBounds: true,
    //   };
    // }

    // Original collision logic continues...
    // First, check for side collisions
    const potentialTs: Array<[number, null]> = [];
    const tx_1 =
      Math.abs(transformedBall.dx) >= EPSILON
        ? (transformedBall.radius + rw / 2.0 - transformedBall.x) /
          transformedBall.dx
        : null;
    const tx_2 =
      Math.abs(transformedBall.dx) >= EPSILON
        ? (-transformedBall.radius - rw / 2.0 - transformedBall.x) /
          transformedBall.dx
        : null;
    const ty_1 =
      Math.abs(transformedBall.dy) >= EPSILON
        ? (transformedBall.radius + rh / 2.0 - transformedBall.y) /
          transformedBall.dy
        : null;
    const ty_2 =
      Math.abs(transformedBall.dy) >= EPSILON
        ? (-transformedBall.radius - rh / 2.0 - transformedBall.y) /
          transformedBall.dy
        : null;

    for (const tCandidate of [tx_1, tx_2, ty_1, ty_2]) {
      if (tCandidate !== null && 0 < tCandidate && tCandidate <= bs) {
        // Additionally check that the ball's position at time t_candidate is within the extended rectangle bounds
        const new_r_bx = transformedBall.x + tCandidate * transformedBall.dx;
        const new_r_by = transformedBall.y + tCandidate * transformedBall.dy;
        if (
          Math.abs(new_r_bx) <= rw / 2.0 + transformedBall.radius + EPSILON &&
          Math.abs(new_r_by) <= rh / 2.0 + transformedBall.radius + EPSILON
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
      [rw / 2.0, rh / 2.0], // TOP LEFT
      [-rw / 2.0, rh / 2.0], // TOP RIGHT
      [-rw / 2.0, -rh / 2.0], // BOTTOM RIGHT
      [rw / 2.0, -rh / 2.0], // BOTTOM LEFT
    ];

    let cornerCollisionT = Infinity;
    let cornerNormalLocal: [number, number] | null = null; // Will store the local normal for the earliest corner collision

    for (const [cx, cy] of corners) {
      // Solve for t in: (transformedBall.x + t*r_bdx - cx)^2 + (transformedBall.y + t*r_bdy - cy)^2 = transformedBall.radius^2
      const A = transformedBall.dx ** 2 + transformedBall.dy ** 2; // should be 1 if normalized
      const B =
        2 *
        ((transformedBall.x - cx) * transformedBall.dx +
          (transformedBall.y - cy) * transformedBall.dy);
      const C =
        (transformedBall.x - cx) ** 2 +
        (transformedBall.y - cy) ** 2 -
        transformedBall.radius ** 2;
      const discriminant = B ** 2 - 4 * A * C;

      if (discriminant < 0) {
        continue; // no real intersection with this corner
      }

      const sqrtDisc = Math.sqrt(discriminant);
      // We choose the smaller positive t
      const tCandidate = (-B - sqrtDisc) / (2 * A);

      if (0 < tCandidate && tCandidate <= bs) {
        // Check if this candidate is the earliest among corner collisions
        if (tCandidate < cornerCollisionT) {
          cornerCollisionT = tCandidate;
          // Compute the collision point in local coordinates
          const collisionX =
            transformedBall.x + tCandidate * transformedBall.dx;
          const collisionY =
            transformedBall.y + tCandidate * transformedBall.dy;
          // Local normal is from the corner to the collision point
          const contactX =
            collisionX -
            transformedBall.radius *
              (transformedBall.dx /
                Math.sqrt(transformedBall.dx ** 2 + transformedBall.dy ** 2));
          const contactY =
            collisionY -
            transformedBall.radius *
              (transformedBall.dy /
                Math.sqrt(transformedBall.dx ** 2 + transformedBall.dy ** 2));
          const normalLocalX = contactX - cx;
          const normalLocalY = contactY - cy;
          const normLength = Math.sqrt(normalLocalX ** 2 + normalLocalY ** 2);

          if (normLength > EPSILON) {
            cornerNormalLocal = [
              normalLocalX / normLength,
              normalLocalY / normLength,
            ];
          } else {
            cornerNormalLocal = [obj.nx, obj.ny]; // fallback; ideally should not happen
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
      const posLocalX = transformedBall.x + minT * transformedBall.dx;
      const posLocalY = transformedBall.y + minT * transformedBall.dy;

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

  static transformIntoBase(ball: Ball, obj: Rectangle): Ball {
    const rx = obj.x;
    const ry = obj.y;
    const rdx = obj.dx;
    const rdy = obj.dy;
    // alpha is the angle of the wall's (or paddle's) direction
    const alpha = rdx !== 0 ? Math.atan2(rdy, rdx) : (rdy * Math.PI) / 2.0;

    const bx = ball.x;
    const by = ball.y;
    const bdx = ball.dx;
    const bdy = ball.dy;

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

    return {
      id: ball.id,
      x: r_bx,
      y: r_by,
      dx: r_bdx,
      dy: r_bdy,
      radius: ball.radius,
      speed: ball.speed,
      isVisible: ball.isVisible,
      doGoal: ball.doGoal,
      doCollision: ball.doCollision,
    };
  }

  static resolveBallInsideObject(
    ball: Ball,
    obj: Rectangle,
    objID: number,
    moveDir: [number, number], // normalized direction of the “mover”
    isBallMovementStep: boolean,
  ): Collision | null {
    // 1) Compute relative velocity
    const relVel: [number, number] = isBallMovementStep
      ? [moveDir[0] * ball.speed, moveDir[1] * ball.speed]
      : [-moveDir[0] * obj.velocity, -moveDir[1] * obj.velocity];

    // 2) Transform ball center into object-local coordinates
    const transformedBall = PhysicsEngine.transformIntoBase(ball, obj);
    const halfW = obj.width / 2;
    const halfH = obj.height / 2;
    const { x: lx, y: ly } = transformedBall;

    // 3) Check if ball is inside the rectangle
    if (
      lx >= -halfW - EPSILON &&
      lx <= halfW + EPSILON &&
      ly >= -halfH - EPSILON &&
      ly <= halfH + EPSILON
    ) {
      console.log(`Ball inside object ${objID}`);

      // 4) Get object's normal (in global space), and reverse if object is the mover
      const normal: [number, number] = isBallMovementStep
        ? [obj.nx, obj.ny]
        : [-obj.nx, -obj.ny];

      // 5) Project ball position onto the rotated local normal
      const θ = Math.atan2(obj.dy, obj.dx);
      const ca = Math.cos(θ),
        sa = Math.sin(θ);
      const nlx = normal[0] * ca + normal[1] * sa;
      const nly = -normal[0] * sa + normal[1] * ca;
      const proj = lx * nlx + ly * nly;

      // 6) Compute penetration and relative velocity dot normal
      const penetration = halfH - proj + 2 * EPSILON;
      const velDotN = relVel[0] * normal[0] + relVel[1] * normal[1];

      // Bail out if moving away — prevents infinite correction
      if (velDotN <= EPSILON) return null;

      // 7) Backtrack to contact position
      const t = penetration / velDotN;
      const contactX = ball.x - relVel[0] * t;
      const contactY = ball.y - relVel[1] * t;

      console.log(`Contact point: (${contactX}, ${contactY})`);

      return {
        objectId: objID,
        distance: penetration,
        normal: normal,
        outOfBounds: { position: [contactX, contactY] },
      };
    }

    return null;
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
    // Check if already inside the object
    const currentDistance = Math.sqrt(
      (ball.x - obj.x) ** 2 + (ball.y - obj.y) ** 2,
    );
    if (currentDistance < ball.radius + obj.radius) {
      return { distance: 0, objectId: objId };
    }

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

    if (0 < t && t <= distance) {
      return { distance: t, objectId: objId };
    }

    return null;
  }
}

export default PhysicsEngine;
