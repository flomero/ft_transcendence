import random
from .game_registry import GAME_REGISTRY


class PowerUpManager():
    """Basic power up management"""
    available_power_ups = []
    pdf = []
    cdf = []

    spawned_power_ups = []
    active_power_ups = []

    def __init__(self, power_ups, game_name, game_mode):
        self.power_up_names = power_ups

        self.default_power_up_size = GAME_REGISTRY[game_name]["game_modes"][game_mode]["default_power_up_settings"]["size"]

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

    def get_state_snapshot(self):
        return {
            'spawned_power_ups': self.spawned_power_ups,
        }

    def load_state_snapshot(self, snapshot):
        self.spawned_power_ups = snapshot['spawned_power_ups']

    def random_power_up(self, rng: random.Random):
        """Sample a random power_up using the CDF"""
        rnd = rng.random()
        for i, cumul in enumerate(self.cdf):
            if rnd < cumul:
                return self.power_up_names[i]

        # fallback
        return self.power_up_names[rng.randint(0, len(self.power_up_names))]

    def spawn_power_up(self, rng: random.Random, position: tuple):
        """Sample then spawn a random power_up at the given position"""
        power_up = self.random_power_up(rng)
        self.spawned_power_ups.append(
            {
                "x": position[0],
                "y": position[1],
                "size": self.default_power_up_size,
                "type": power_up,
                "visible": True
            }
        )
