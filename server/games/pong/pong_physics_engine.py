import math
from .modifiers.pong_modifier_base import PongModifierBase

class PongPhysicsEngine:
    @staticmethod
    def do_collision_check(ball, game):
        """Moves the ball while handling precise collision resolution."""
        remaining_distance = ball["speed"]
        loop_counter = 0

        while remaining_distance > 0:
            paddle_collision = PongPhysicsEngine.detect_collision(ball, game.player_paddles, True)
            wall_collision = PongPhysicsEngine.detect_collision(ball, game.walls, False)

            # Determine the closest collision
            collision = None
            if paddle_collision and (not wall_collision or paddle_collision["distance"] < wall_collision["distance"]):
                collision = paddle_collision
            elif wall_collision:
                collision = wall_collision

            print(f"  |- collision: {collision}\n")

            if collision:
                travel_distance = collision["distance"]
                ball["x"] += ball["dx"] * travel_distance
                ball["y"] += ball["dy"] * travel_distance

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
                ball["x"] += ball["dx"] * remaining_distance
                ball["y"] += ball["dy"] * remaining_distance
                break

            print(f"Stuck in do_collision_check: {loop_counter}")
            print(f"  |- remaining_distance: {remaining_distance}")
            print(f"  |- collision: {collision}\n")
            loop_counter += 1
            if loop_counter > ball["speed"] + 1:
                break

    @staticmethod
    def detect_collision(ball, objects, is_paddle):
        """Checks for collisions with paddles or walls."""
        closest_collision = None

        for i in range(len(objects)):
            collision = PongPhysicsEngine.ball_rect_collision(ball, objects[i])
            if collision and (not closest_collision or collision["distance"] < closest_collision["distance"]):
                collision["object_id"] = i
                collision["type"] = "paddle" if is_paddle else "wall"
                closest_collision = collision

        return closest_collision

    @staticmethod
    def ball_rect_collision(ball, obj):
        """Checks if the ball collides with a rotated object."""
        px, py = obj["x"], obj["y"]
        dx, dy = obj["dx"], obj["dy"]
        w, h = obj["width"], obj["height"]

        bx, by = ball["x"], ball["y"]

        # Transform ball position into the object's local space
        relative_x = (bx - px) * dx + (by - py) * dy
        relative_y = -(bx - px) * dy + (by - py) * dx

        # Check for collision in local space
        if abs(relative_x) <= w / 2 and abs(relative_y) <= h / 2:
            collision_distance = max(0, h / 2 - abs(relative_y))  # Approximate
            return {"distance": collision_distance, "normal": (-dy, dx)}

        return None

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
