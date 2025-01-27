import math
from .modifiers.pong_modifier_base import PongModifierBase

EPSILON = 1e-6

class PongPhysicsEngine:
    @staticmethod
    def do_collision_check(ball, game):
        """Moves the ball while handling precise collision resolution."""
        remaining_distance = ball["speed"]
        loop_counter = 0

        while remaining_distance > 0:
            paddle_collision = PongPhysicsEngine.detect_collision(ball, remaining_distance, game.player_paddles, True)
            wall_collision = PongPhysicsEngine.detect_collision(ball, remaining_distance, game.walls, False)

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

                PongPhysicsEngine.resolve_collision(ball, collision)

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

            print(f"Stuck in do_collision_check: {loop_counter}")
            print(f"  |- remaining_distance: {remaining_distance}")
            print(f"  |- collision: {collision}\n")
            loop_counter += 1
            if loop_counter > ball["speed"] + 1:
                break

    @staticmethod
    def detect_collision(ball, distance, objects, is_paddle):
        """Checks for collisions with paddles or walls."""
        closest_collision = None

        for i in range(len(objects)):
            collision = PongPhysicsEngine.ball_rect_collision(ball, distance, objects[i])
            # print(f"  |-> collision: {collision}")
            if collision and (not closest_collision or collision["distance"] < closest_collision["distance"]):
                collision["object_id"] = i
                collision["type"] = "paddle" if is_paddle else "wall"
                closest_collision = collision

        return closest_collision

    @staticmethod
    def ball_rect_collision(ball, distance, obj):
        """Checks if the ball collides with a rotated object."""
        rx, ry = obj["x"], obj["y"]
        rdx, rdy = obj["dx"], obj["dy"]
        rw, rh = obj["width"], obj["height"]

        bx, by = ball["x"], ball["y"]
        bdx, bdy = ball["dx"], ball["dy"]
        br = ball["size"]
        bs = distance

        rd_length = math.sqrt(rdx**2 + rdy**2)
        if rd_length > EPSILON:
            rdx /= rd_length
            rdy /= rd_length

        # Transforms ball properties to object's base
        alpha = (- math.atan2(rdy, rdx)) if rdx != 0 else rdy * math.pi / 2.0

        dx, dy = (bx - rx), (by - ry)
        ca, sa = round(math.cos(alpha), ndigits=2), round(math.sin(alpha), ndigits=2)

        r_bx = (dx * ca + dy * sa)
        r_by = (-dx * sa + dy * ca)
        r_bdx = (bdx * ca + bdy * sa)
        r_bdy = (-bdx * sa + bdy * ca)

        collision = []
        # n_x = (-rdy) * rdx + rdx * (-rdy)
        # n_y = (-rdy) * rdy + rdx * rdx

        # First checks:
        # If there exist a t such that
        #  - rt_bx <= (br + rw / 2.0) -> possible solution, else None
        # or
        #  - rt_by <= (br + rh / 2.0) -> possible solution, else None

        # abs_r_bx = abs(r_bx)
        # abs_r_by = abs(r_by)

        # abs_r_bdx = r_bdx if r_bx >= 0 else -r_bdx
        # abs_r_bdy = r_bdy if r_by >= 0 else -r_bdy

        tx = abs((br + rw / 2.0 - r_bx) / r_bdx) if abs(r_bdx) >= EPSILON else None
        ty = abs((br + rh / 2.0 - r_by) / r_bdy) if abs(r_bdy) >= EPSILON else None

        if not tx and r_bx > (br + rw / 2.0):
            print(f"Early stop, no collisions possible")
            return None

        if not ty and r_by > (br + rh / 2.0):
            print(f"Early stop, no collisions possible")
            return None

        min_t = min(tx, ty)

        if  EPSILON < min_t <= bs and \
            ((r_bx + min_t * r_bdx) <= (br + rw / 2.0)) and \
            ((r_by + min_t * r_bdy) <= (br + rh / 2.0)):
            # print(f"Collision: dist = {min_t}")
            collision.append({"distance": min_t, "normal": (-rdy, rdx)})


        # if tx and ty and abs(tx - ty) < EPSILON and 0 <= tx <= bs:
        #     collision.append({"distance": tx, "normal": (-rdy, rdx)})

        # if tx and 0 <= tx <= bs:
        #     # TODO: handle side check to compute the normal
        #     collision.append({"distance": tx, "normal": (-rdy, rdx)})

        # if ty and 0 <= ty <= bs:
        #     # TODO: handle side check to compute the normal
        #     collision.append({"distance": ty, "normal": (-rdy, rdx)})

        if len(collision) == 0:
            # if min_t <= bs:
            #     print(f"ball:")
            #     print(f"  |- pos     : {(bx, by)}")
            #     print(f"  |- dir     : {(bdx, bdy)}")
            #     print(f"  |- pos in R: {(r_bx, r_by)}")
            #     print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            #     print(f"obj:")
            #     print(f"  |- pos: {(rx, ry)}\t| format: {(rw, rh)}")
            #     print(f"    |- dx: {dx}")
            #     print(f"    |- dy: {dy}")
            #     print(f"  |- dir: {(rdx, rdy)}")
            #     print(f"  |- alpha: {alpha}\t| {math.degrees(alpha)}")
            #     print(f"    |- cos(alpha): {ca}")
            #     print(f"    |- sin(alpha): {sa}")
            #     print(f"  |--> No collision: {tx} | {ty}")
            #     print(f"    |--> new pos:     {(r_bx + min_t * r_bdx, r_by + min_t * r_bdy)}")
            #     print(f"    |--> should be <= {(br + rw/2, br + rh/2)}")
            #     print()
            return None

        # Get the minimum distance
        min_index, min_value = 0, collision[0]["distance"]
        for i in range(1, len(collision)):
            if collision[i]["distance"] < min_value:
                min_index, min_value = i, collision[i]["distance"]

        print(f"ball:")
        print(f"  |- pos     : {(bx, by)}")
        print(f"  |- dir     : {(bdx, bdy)}")
        print(f"  |- pos in R: {(r_bx, r_by)}")
        print(f"  |- dir in R: {(r_bdx, r_bdy)}")
        print(f"obj:")
        print(f"  |- pos: {(rx, ry)}")
        print(f"    |- dx: {dx}")
        print(f"    |- dy: {dy}")
        print(f"  |- dir: {(rdx, rdy)}")
        print(f"  |- alpha: {alpha}\t| {math.degrees(alpha)}")
        print(f"    |- cos(alpha): {ca}")
        print(f"    |- sin(alpha): {sa}")
        print(f"  |--> Solutions: {tx} | {ty}")
        print(f"    |--> new pos:     {(r_bx + min_t * r_bdx, r_by + min_t * r_bdy)}")
        print(f"    |--> should be <= {(br + rw/2, br + rh/2)}")
        print(f"  |--> collision: {collision[min_index]}\n")
        print()

        return collision[min_index]

        # FIRST TEST

        # # Transforms ball properties to object's base
        # # r_bx, r_by = (bx - rx), (by - ry)
        # r_bx = (bx - rx) * rdx + (by - ry) * rdy
        # r_by = (bx - rx) * (-rdy) + (by - ry) * rdx
        # # alpha = math.atan2(rdy, rdx) if rdx != 0 else 0
        # r_bdx = bdx * rdx + bdy * rdy
        # r_bdy = bdx * (-rdy) + bdy * rdx
        # # r_bdx, r_bdy = (bdx * math.cos(-alpha) - bdy * math.sin(-alpha)), (-bdx * math.sin(-alpha) + bdy * math.cos(-alpha))

        # # All possible ball positions in the object's base along it's direction
        # # In range if 0 <= t <= bs
        # #   - rt_bx = r_bx + t * r_bdx
        # #   - rt_by = r_by + t * r_bdy

        # # First checks:
        # # If there exist a t such that
        # #  - rt_bx <= (br + rw / 2.0) -> possible solution, else None
        # # or
        # #  - rt_by <= (br + rh / 2.0) -> possible solution, else None
        # tx = (br + rw / 2.0 - r_bx) / r_bdx if abs(r_bdx) >= EPSILON else None
        # ty = (br + rh / 2.0 - r_by) / r_bdy if abs(r_bdy) >= EPSILON else None

        # # if  not ((tx and 0 <= tx <= bs) or \
        # #     (ty and 0 <= ty <= bs)):
        # #     print(f"Early stop, no collisions possible")
        # #     return None
        # # if  (not tx and r_bx > (br + rw / 2.0)) or \
        # #     (not ty and r_by > (br + rh / 2.0)):
        # #     print(f"Early stop, no collisions possible")
        # #     return None


        # # Computes the solutions of the equations: (close side check)
        # # If there exist a 0 <= t <= bs such that
        # #   - rt_bx <= rw / 2.0 -> collision (to compute)
        # # or
        # #   - rt_by <= rh / 2.0 -> collision (to compute)
        # tx = (rw / 2.0 - r_bx) / r_bdx if abs(r_bdx) >= EPSILON else None
        # ty = (rh / 2.0 - r_by) / r_bdy if abs(r_bdy) >= EPSILON else None

        # collision = None
        # n_x = (-rdy) * rdx + rdx * (-rdy)
        # n_y = (-rdy) * rdy + rdx * rdx

        # if tx and 0 <= tx <= bs:
        #     collision = {"distance": tx, "normal": (n_x, n_y)}

        # if ty and 0 <= ty <= bs:
        #     temp_collision = {"distance": ty, "normal": (n_x, n_y)}
        #     if not collision or (temp_collision and temp_collision["distance"] < collision["distance"]):
        #         collision = temp_collision

        # # Computes the solutions of the equation: (corner check)
        # # If there exist a 0 <= t <= bs such that
        # #   - (rt_bx - rw / 2.0)^2 + (rt_by - rh / 2.0)^2 <= br^2
        # # Then compute the collision and return it
        # a = r_bdx**2 + r_bdy**2
        # b = 2.0 * r_bx * r_bdx - r_bdx * rw + 2.0 * r_by * r_bdy - r_bdy * rh
        # c = r_bx**2 + (rw**2) / 4.0 - r_bx * rw + r_by**2 + (rh**2) / 4.0 - r_by * rh - br**2
        # delta = b**2 - 4.0 * a * c
        # t1, t2 = None, None

        # if delta >= 0:
        #     t1 = (-b - math.sqrt(delta)) / (2.0 * a)

        #     if 0 <= t1 <= bs:
        #         temp_collision = {"distance": t1, "normal": (n_x, n_y)}
        #         if not collision or (temp_collision and temp_collision["distance"] < collision["distance"]):
        #             collision = temp_collision

        #     if delta >= EPSILON:
        #         t2 = (-b + math.sqrt(delta)) / (2.0 * a)
        #         if 0 <= t2 <= bs:
        #             temp_collision = {"distance": t2, "normal": (n_x, n_y)}
        #             if not collision or (temp_collision and temp_collision["distance"] < collision["distance"]):
        #                 collision = temp_collision

        if collision:
            print(f"ball:")
            print(f"  |- pos in R: {(r_bx, r_by)}")
            print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            print(f"obj:")
            print(f"  |- pos: {(rx, ry)}")
            print(f"  |- dir: {(rdx, rdy)}")
            print(f"  |- 1st check solutions: {(tx, ty)}")
            print(f"  |- 2nd check: {(a, b, c)}\t| {delta}")
            if t1:
                print(f"    |- t1: {t1}")
            if t2:
                print(f"    |- t2: {t2}")
            print(f"  |-> collision: {collision}")

        return collision

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

        print(f"compute_collision called: distance: {t}, normal: {normal}")
        return {"distance": t, "normal": normal}

    @staticmethod
    def resolve_collision(ball, collision):
        """Adjusts the ball's direction after a collision."""
        normal = collision["normal"]

        # Compute reflection
        dot_product = 2 * (ball["dx"] * normal[0] + ball["dy"] * normal[1])
        ball["dx"] -= dot_product * normal[0]
        ball["dy"] -= dot_product * normal[1]

        print(f"new ball direction: {ball}")

        # Normalize direction
        speed = math.sqrt(ball["dx"]**2 + ball["dy"]**2)
        ball["dx"] /= speed
        ball["dy"] /= speed
