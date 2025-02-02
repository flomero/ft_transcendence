import math

EPSILON = 1e-2

class MultiplayerPongPhysicsEngine:
    @staticmethod
    def do_collision_check(ball, game):
        """Moves the ball while handling precise collision resolution."""
        remaining_distance = ball["speed"]
        loop_counter = 0

        while remaining_distance > EPSILON:
            paddle_collision = MultiplayerPongPhysicsEngine.detect_collision(ball, remaining_distance, game.player_paddles, True)
            wall_collision = MultiplayerPongPhysicsEngine.detect_collision(ball, remaining_distance, game.walls, False)

            # Determine the closest collision
            collision = None
            # print(f"\nball pos: {(ball["x"], ball["y"])}")
            # print(f"  |- collision: {collision}")
            if paddle_collision and (not wall_collision or paddle_collision["distance"] < wall_collision["distance"]):
                collision = paddle_collision
            elif wall_collision:
                collision = wall_collision


            if collision:
                travel_distance = collision["distance"]
                ball["x"] += round(ball["dx"] * travel_distance, ndigits=2)
                ball["y"] += round(ball["dy"] * travel_distance, ndigits=2)

                MultiplayerPongPhysicsEngine.resolve_collision(ball, collision)

                # Handle modifiers
                if collision["type"] == "paddle":
                    game.trigger_modifiers("on_bounce", player_id=collision["object_id"])
                elif collision["type"] == "wall":
                    if collision["object_id"] % 2 == 0:  # Goal wall
                        game.trigger_modifiers("on_goal", player_id=game.last_player_hit)
                    else:
                        game.trigger_modifiers("on_bounce")

                remaining_distance -= travel_distance
            else:
                # Move ball normally if no collision
                ball["x"] += round(ball["dx"] * remaining_distance, ndigits=2)
                ball["y"] += round(ball["dy"] * remaining_distance, ndigits=2)
                break

            # print(f"Stuck in do_collision_check: {loop_counter}")
            # print(f"  |- remaining_distance: {remaining_distance}")
            # print(f"  |- collision: {collision}\n")
            loop_counter += 1
            if loop_counter > (ball["speed"] * 2.0) + 1:
                break

    @staticmethod
    def detect_collision(ball, distance, objects, is_paddle):
        """Checks for collisions with paddles or walls."""
        closest_collision = None

        for i in range(len(objects)):
            collision = MultiplayerPongPhysicsEngine.ball_rect_collision(ball, distance, objects[i])
            # print(f"  |-> collision: {collision}")
            if collision and (not closest_collision or collision["distance"] < closest_collision["distance"]):
                collision["object_id"] = i
                collision["type"] = "paddle" if is_paddle else "wall"
                closest_collision = collision

        return closest_collision

    @staticmethod
    def ball_rect_collision(ball, distance, obj):
        """Checks if the ball collides with a rotated object, including corner collisions."""
        rx, ry = obj["x"], obj["y"]
        rdx, rdy = obj["dx"], obj["dy"]
        rnx, rny = obj["nx"], obj["ny"]
        rw, rh = obj["width"], obj["height"]
        # alpha is the angle of the wall’s (or paddle’s) direction
        alpha = math.atan2(rdy, rdx) if rdx != 0 else (rdy * math.pi / 2.0)

        bx, by = ball["x"], ball["y"]
        bdx, bdy = ball["dx"], ball["dy"]
        br = ball["size"]
        bs = distance

        # Transform ball properties into the object’s local (rotated) coordinate system
        dx, dy = (bx - rx), (by - ry)
        ca, sa = math.cos(alpha), math.sin(alpha)
        # local ball position
        r_bx = dx * ca + dy * sa
        r_by = -dx * sa + dy * ca
        # local ball direction
        r_bdx = bdx * ca + bdy * sa
        r_bdy = -bdx * sa + bdy * ca

        # First, check for side collisions (as in your current code):
        potential_ts = []
        tx_1 = ((br + rw/2.0 - r_bx) / r_bdx) if abs(r_bdx) >= EPSILON else None
        tx_2 = ((-br - rw/2.0 - r_bx) / r_bdx) if abs(r_bdx) >= EPSILON else None
        ty_1 = ((br + rh/2.0 - r_by) / r_bdy) if abs(r_bdy) >= EPSILON else None
        ty_2 = ((-br - rh/2.0 - r_by) / r_bdy) if abs(r_bdy) >= EPSILON else None

        for t_candidate in [tx_1, tx_2, ty_1, ty_2]:
            if t_candidate is not None and EPSILON < t_candidate <= bs:
                # Additionally check that the ball’s position at time t_candidate is within the extended rectangle bounds.
                new_r_bx = r_bx + t_candidate * r_bdx
                new_r_by = r_by + t_candidate * r_bdy
                if (abs(new_r_bx) <= (rw/2.0 + br + EPSILON) and
                    abs(new_r_by) <= (rh/2.0 + br + EPSILON)):
                    potential_ts.append((t_candidate, None))  # normal will be computed below

        # Determine the earliest side collision time (if any)
        side_collision_t = min((t for t, _ in potential_ts), default=math.inf)

        # Now add the corner collision check.
        # Define the four corners in the object’s local space:
        corners = [
            (rw/2.0,  rh/2.0),
            (-rw/2.0, rh/2.0),
            (-rw/2.0, -rh/2.0),
            (rw/2.0,  -rh/2.0)
        ]
        corner_collision_t = math.inf
        corner_normal_local = None  # Will store the local normal for the earliest corner collision

        for cx, cy in corners:
            # Solve for t in: (r_bx + t*r_bdx - cx)^2 + (r_by + t*r_bdy - cy)^2 = br^2
            A = r_bdx**2 + r_bdy**2  # should be 1 if normalized
            B = 2 * ((r_bx - cx) * r_bdx + (r_by - cy) * r_bdy)
            C = (r_bx - cx)**2 + (r_by - cy)**2 - br**2
            discriminant = B**2 - 4*A*C
            if discriminant < 0:
                continue  # no real intersection with this corner
            sqrt_disc = math.sqrt(discriminant)
            # We choose the smaller positive t
            t_candidate = (-B - sqrt_disc) / (2*A)
            if EPSILON < t_candidate <= bs:
                # Check if this candidate is the earliest among corner collisions
                if t_candidate < corner_collision_t:
                    corner_collision_t = t_candidate
                    # Compute the collision point in local coordinates:
                    collision_x = r_bx + t_candidate * r_bdx
                    collision_y = r_by + t_candidate * r_bdy
                    # Local normal is from the corner to the collision point:
                    normal_local_x = collision_x - cx
                    normal_local_y = collision_y - cy
                    norm_length = math.sqrt(normal_local_x**2 + normal_local_y**2)
                    if norm_length > EPSILON:
                        corner_normal_local = (normal_local_x / norm_length, normal_local_y / norm_length)
                    else:
                        corner_normal_local = (0, 0)  # fallback; ideally should not happen

        # Now determine which collision (side or corner) happens first.
        if corner_collision_t < side_collision_t:
            min_t = corner_collision_t
            # Convert the local normal back to global coordinates using the inverse rotation:
            nlx, nly = corner_normal_local
            normal_global = (nlx * ca - nly * sa, nlx * sa + nly * ca)
        elif potential_ts:
            # For a side collision, we must decide which side was hit.
            # Use the ball position at time min_t to choose a normal consistent with the side.
            min_t = side_collision_t
            pos_local_x = r_bx + min_t * r_bdx
            pos_local_y = r_by + min_t * r_bdy
            # Determine which side is penetrated:
            # (Note: the ordering below is one possibility; you might need to adjust if your objects are oriented differently.)
            if pos_local_x >= rw/2.0:
                # Right side: the local normal is along +x
                normal_local = (1, 0)
            elif pos_local_x <= -rw/2.0:
                normal_local = (-1, 0)
            elif pos_local_y >= rh/2.0:
                normal_local = (0, 1)
            else:  # pos_local_y <= -rh/2.0
                normal_local = (0, -1)
            normal_global = (normal_local[0] * ca - normal_local[1] * sa,
                            normal_local[0] * sa + normal_local[1] * ca)
        else:
            # No collision detected.
            return None

        # print(f"ball:")
        # print(f"  |- pos     : {(bx, by)}")
        # print(f"  |- dir     : {(bdx, bdy)}")
        # print(f"  |- pos in local: {(r_bx, r_by)}")
        # print(f"  |- dir in local: {(r_bdx, r_bdy)}")
        # print(f"obj:")
        # print(f"  |- pos: {(rx, ry)}")
        # print(f"  |- angle (rad): {alpha}  | (deg): {math.degrees(alpha)}")
        # print(f"  |- corners: {corners}")
        # print(f"  |--> collision t: {min_t}")
        # print(f"  |--> collision normal (global): {normal_global}\n")

        return {"distance": min_t, "normal": normal_global}


    @staticmethod
    def compute_collision(t, r_bx, r_by, r_bdx, r_bdy, rw, rh, br):
        """Computes the distance and normal at the point of intersection."""
        intersection_x = r_bx + t * r_bdx
        intersection_y = r_by + t * r_bdy

        if abs(intersection_x) <= rw / 2.0:
            normal = (0, 1) if intersection_y > 0 else (0, -1)
        elif abs(intersection_y) <= rh / 2.0:
            normal = (1, 0) if intersection_x > 0 else (-1, 0)
        else:
            normal_x = intersection_x - (rw / 2.0 if intersection_x > 0 else -rw / 2.0)
            normal_y = intersection_y - (rh / 2.0 if intersection_y > 0 else -rh / 2.0)
            norm_length = math.sqrt(normal_x**2 + normal_y**2)
            normal = (normal_x / norm_length, normal_y / norm_length)

        # print(f"compute_collision called: distance: {t}, normal: {normal}")
        return {"distance": t, "normal": normal}

    @staticmethod
    def resolve_collision(ball, collision):
        """Adjusts the ball's direction after a collision."""
        normal = collision["normal"]

        # Compute reflection
        dot_product = 2 * (ball["dx"] * normal[0] + ball["dy"] * normal[1])
        ball["dx"] -= dot_product * normal[0]
        ball["dy"] -= dot_product * normal[1]

        # print(f"new ball direction: {ball}")

        # Normalize direction
        speed = math.sqrt(ball["dx"]**2 + ball["dy"]**2)
        ball["dx"] /= speed
        ball["dy"] /= speed

        # Move the ball slightly outside the collision surface to prevent sticking
        ball["x"] += normal[0] * EPSILON * 10
        ball["y"] += normal[1] * EPSILON * 10
