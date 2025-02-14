import random
from .game_registry import GAME_REGISTRY


class PowerUpManager():
    """Basic power up management"""
    available_power_ups = []
    pdf = []
    cdf = []

    spawned_power_ups = []
    active_power_ups = []

    def __init__(self, power_ups):
        self.power_up_names = power_ups

        # Get the power_up from the registry
        self.available_power_ups = [
            GAME_REGISTRY["pong"]["power_ups"][power_up_name]
            for power_up_name in GAME_REGISTRY["pong"]["power_ups"]
            if power_up_name in power_ups
        ]

        # Compute the Probability Density Function
        self.pdf = [
            power_up["spawn_weight"] + 0.0
            for power_up in self.available_power_ups
        ]

        # Normalize the PDF
        total_density = sum(self.pdf)
        self.pdf = [d/total_density for d in self.pdf]

        # Compute the Cumulative Density Function
        self.cdf = []
        cumul = 0.0
        for d in self.pdf:
            cumul += d
            self.cdf.append(cumul)

    def random_power_up(self):
        """Sample a random power_up using the CDF"""
        rnd = random.random()
        for i, cumul in enumerate(self.cdf):
            if rnd < cumul:
                return self.power_up_names[i]

        # fallback
        return self.power_up_names[random.randint(0, len(self.power_up_names))]

    def spawn_power_up(self, position: tuple):
        """Sample then spawn a random power_up at the given position"""
        power_up = self.random_power_up()
        self.spawned_power_ups.append(
            {
                "x": position[0],
                "y": position[1],
                "size": 2,
                "type": power_up,
                "visible": True
            }
        )
