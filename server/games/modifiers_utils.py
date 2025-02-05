import math
import random

EPSILON = 1e-3

def compute_offset(player_count, scoring_player_id):
    base_offset = 2.0 * scoring_player_id * math.pi / player_count
    return (base_offset) if base_offset <= math.pi else (base_offset - 2.0 * math.pi)


def compute_reset_angle(player_count: int, scoring_player_id: int, resolution=360):
    """Computes the reset angle of the ball after a goal

    Args:
        player_count (int): number of players
        scoring_player_id (int): scoring player's id
        resolution (int, optional): Number of sample points. Defaults to 360.

    Returns:
        float: offset angle from the scoring player's paddle angle
    """

    width = math.sin(math.pi / (2.0 * player_count))
    offset = compute_offset(player_count, scoring_player_id)

    # Discretize the window.
    thetas = [i / 100.0 for i in range(-math.trunc(100 * math.pi), math.trunc(100 * math.pi), math.trunc(100 * 2.0 * math.pi / resolution))]

    # Compute the (unnormalized) pdf.
    pdf = []
    for theta in thetas:
        alpha = math.pi * (theta - offset) / width
        density = (math.sin(alpha) / alpha) if abs(alpha) > EPSILON else 1.0

        density = density if density > 0.0 else 0.0
        pdf.append(density)

    # Normalize the pdf.
    total = sum(pdf)
    if total == 0:
        # Fallback to uniform if something goes wrong.
        pdf = [1.0 / len(pdf)] * len(pdf)
    else:
        pdf = [p / total for p in pdf]


    # Build the cumulative distribution (CDF).
    cdf = []
    cumulative = 0.0
    for p in pdf:
        cumulative += p
        cdf.append(cumulative)

    # Sample an angle from the CDF.
    r = random.random()
    for i, cumul_val in enumerate(cdf):
        if r < cumul_val:
            return thetas[i]

    return thetas[-1]

def spawn_powerup_bell(arena_radius, margin, bell_center, obstacles=[], max_attempts=1000):
    # Allowed radial interval:
    R_min = margin
    R_max = arena_radius - margin
    span = R_max - R_min
    sigma = span * 2.0

    # Precompute normalization factor for the radial PDF.
    # The unnormalized CDF is: F(r) = ∫ exp(-((s-bell_center)**2)/(sigma**2)) ds.
    # We have: ∫ exp(-((s-bell_center)**2)/(sigma**2)) ds = sigma * sqrt(pi)/2 * erf((s - bell_center)/sigma) + C.
    # Thus, the normalization constant is:
    norm = (math.erf((R_max - bell_center) / sigma) - math.erf((R_min - bell_center) / sigma))

    def sample_r():
        """Sample a radial coordinate from the truncated Gaussian."""
        # Draw u in [0,1] and invert the CDF:
        u = random.random()
        # The target value in the erf-space:
        target = math.erf((R_min - bell_center) / sigma) + u * norm
        # Invert the erf to get:
        r = bell_center + sigma * math.erfc(target)
        return r

    def in_any_obstacle(x, y):
        """Return True if (x,y) falls inside any obstacle's exclusion circle."""
        for obs in obstacles:
            exclusion_radius = max(obs["width"], obs["height"]) / 2.0
            if math.hypot(x - obs["x"], y - obs["y"]) < exclusion_radius:
                return True
        return False

    for _ in range(max_attempts):
        r = sample_r()
        theta = random.random() * 2 * math.pi
        x = r * math.cos(theta)
        y = r * math.sin(theta)
        if not in_any_obstacle(x, y):
            return x, y

    raise RuntimeError("Could not find a valid power-up position after {} attempts.".format(max_attempts))