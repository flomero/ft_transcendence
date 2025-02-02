import math
from .modifiers.pong_modifier_base import PongModifierBase

EPSILON = 1e-2

class PongPhysicsEngine:
    @staticmethod
    def do_collision_check(ball, game):
        """Moves the ball while handling precise collision resolution."""
        remaining_distance = ball["speed"]
        loop_counter = 0

        while remaining_distance > EPSILON:
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
            if loop_counter > (ball["speed"] * 2.0) + 1:
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
        rnx, rny = obj["nx"], obj["ny"]
        rw, rh = obj["width"], obj["height"]
        # alpha = obj["alpha"]

        bx, by = ball["x"], ball["y"]
        bdx, bdy = ball["dx"], ball["dy"]
        br = ball["size"]
        bs = distance

        # rd_length = math.sqrt(rdx**2 + rdy**2)
        # if rd_length > EPSILON:
        #     rdx /= rd_length
        #     rdy /= rd_length

        # Transforms ball properties to object's base
        alpha = (math.atan2(rdy, rdx)) if rdx != 0 else rdy * math.pi / 2.0

        dx, dy = (bx - rx), (by - ry)
        ca, sa = round(math.cos(alpha), ndigits=3), round(math.sin(alpha), ndigits=3)

        r_bx = (dx * ca + dy * sa)
        r_by = (-dx * sa + dy * ca)
        r_bdx = (bdx * ca + bdy * sa)
        r_bdy = (-bdx * sa + bdy * ca)

        collision = []

        # Disable collisions if inside the object
        if  (abs(r_bx) <= (rw / 2.0 + br)) and \
            (abs(r_by) <= (rh / 2.0 + br)):
            # print(f"Skipping collisions from within")
            # print(f"ball:")
            # print(f"  |- pos     : {(bx, by)}")
            # print(f"  |- dir     : {(bdx, bdy)}")
            # print(f"  |- pos in R: {(r_bx, r_by)}")
            # print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            # print(f"obj:")
            # print(f"  |- pos: {(rx, ry)}")
            # print(f"    |- dx: {dx}")
            # print(f"    |- dy: {dy}")
            # print(f"  |- dir: {(rdx, rdy)}")
            return None

        if  abs(r_bdx) < EPSILON and \
            abs(r_bdy) < EPSILON:
            # print(f"The ball doesn't move so there shouldn't be any collisions")
            # print(f"ball:")
            # print(f"  |- pos     : {(bx, by)}")
            # print(f"  |- dir     : {(bdx, bdy)}")
            # print(f"  |- pos in R: {(r_bx, r_by)}")
            # print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            # print(f"obj:")
            # print(f"  |- pos: {(rx, ry)}")
            # print(f"    |- dx: {dx}")
            # print(f"    |- dy: {dy}")
            # print(f"  |- dir: {(rdx, rdy)}")
            return None

        tx_1 = ((br + rw / 2.0 - r_bx) / r_bdx) if abs(r_bdx) >= EPSILON else None
        tx_2 = ((- br - rw / 2.0 - r_bx) / r_bdx) if abs(r_bdx) >= EPSILON else None
        ty_1 = ((br + rh / 2.0 - r_by) / r_bdy) if abs(r_bdy) >= EPSILON else None
        ty_2 = ((- br - rh / 2.0 - r_by) / r_bdy) if abs(r_bdy) >= EPSILON else None

        if not tx_1 and abs(r_bx) > (br + rw / 2.0):
            # print(f"Early stop, no collisions possible")
            # print(f"ball:")
            # print(f"  |- pos     : {(bx, by)}")
            # print(f"  |- dir     : {(bdx, bdy)}")
            # print(f"  |- pos in R: {(r_bx, r_by)}")
            # print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            # print(f"obj:")
            # print(f"  |- pos: {(rx, ry)}")
            # print(f"    |- dx: {dx}")
            # print(f"    |- dy: {dy}")
            # print(f"  |- dir: {(rdx, rdy)}")
            return None

        if not ty_1 and abs(r_by) > (br + rh / 2.0):
            # print(f"Early stop, no collisions possible")
            # print(f"ball:")
            # print(f"  |- pos     : {(bx, by)}")
            # print(f"  |- dir     : {(bdx, bdy)}")
            # print(f"  |- pos in R: {(r_bx, r_by)}")
            # print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            # print(f"obj:")
            # print(f"  |- pos: {(rx, ry)}")
            # print(f"    |- dx: {dx}")
            # print(f"    |- dy: {dy}")
            # print(f"  |- dir: {(rdx, rdy)}")
            return None

        # if abs(rx - 60) <= 1 and abs(ry - 18) <= 1:
        #     print(f"  |--> Solutions: {tx_1}/{tx_2} | {ty_1}/{ty_2}")
        if not tx_1 or not (EPSILON < tx_1 <= bs):
            tx_1 = math.inf
        if not tx_2 or not (EPSILON < tx_2 <= bs):
            tx_2 = math.inf
        if not ty_1 or not (EPSILON < ty_1 <= bs):
            ty_1 = math.inf
        if not ty_2 or not (EPSILON < ty_2 <= bs):
            ty_2 = math.inf
        min_t = [
            t
            for t in sorted([tx_1, tx_2, ty_1, ty_2])
            if  (EPSILON < t <= bs) and \
                (abs(r_bx + t * r_bdx) <= (br + rw / 2.0 + EPSILON)) and \
                (abs(r_by + t * r_bdy) <= (br + rh / 2.0 + EPSILON))
        ]

        if len(min_t) == 0:
            # if abs(rx - 23) <= 1 and abs(ry - 69) <= 1:
            #     print(f"ball:")
            #     print(f"  |- pos     : {(bx, by)}")
            #     print(f"  |- dir     : {(bdx, bdy)}")
            #     print(f"  |- pos in R: {(r_bx, r_by)}")
            #     print(f"  |- dir in R: {(r_bdx, r_bdy)}")
            #     print(f"obj:")
            #     print(f"  |- pos: {(rx, ry)}")
            #     print(f"    |- dx: {dx}")
            #     print(f"    |- dy: {dy}")
            #     print(f"  |- dir: {(rdx, rdy)}")
            #     print(f"  |- alpha: {alpha}\t| {math.degrees(alpha)}")
            #     print(f"    |- cos(alpha): {ca}")
            #     print(f"    |- sin(alpha): {sa}")
            #     print(f"  |--> Solutions: {tx_1}/{tx_2} | {ty_1}/{ty_2}  -->  {min_t}")
            #     if min_t:
            #         print(f"    |--> new pos:     {(r_bx + min_t * r_bdx, r_by + min_t * r_bdy)}")
            #     print(f"    |--> should be <= {(br + rw/2, br + rh/2)}")
            #     print()
            return None

        min_t = min_t[0]
        #  and (EPSILON < min_t <= bs) and \
        #  (abs(r_bx + min_t * r_bdx) <= (br + rw / 2.0 + EPSILON)) and \
        #  (abs(r_by + min_t * r_bdy) <= (br + rh / 2.0 + EPSILON))
            # Compute which side was hit
        if (r_bx + min_t * r_bdx) >= (rw / 2.0):  # Right side
            normal_x, normal_y = rdx, rdy
        elif (r_bx + min_t * r_bdx) <= -(rw / 2.0): # Left side
            normal_x, normal_y = -rdx, -rdy
        elif (r_by + min_t * r_bdy) >= (rh / 2.0):  # Top side
            normal_x, normal_y = -rdy, rdx
        else:
            normal_x, normal_y = rdy, -rdx

        collision.append({"distance": min_t, "normal": (normal_x, normal_y)})

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
        print(f"  |--> Solutions: {tx_1}/{tx_2} | {ty_1}/{ty_2}  -->  {min_t}")
        print(f"    |--> new pos:     {(r_bx + min_t * r_bdx, r_by + min_t * r_bdy)}")
        print(f"    |--> should be <= {(br + rw/2, br + rh/2)}")
        print(f"  |--> collision: {collision[min_index]}\n")
        print()

        return collision[min_index]

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

        # Move the ball slightly outside the collision surface to prevent sticking
        ball["x"] += normal[0] * EPSILON * 10
        ball["y"] += normal[1] * EPSILON * 10
