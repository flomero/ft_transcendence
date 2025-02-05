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