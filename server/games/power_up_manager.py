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

        # Get the power_up from the registry
        self.available_power_ups = [
            GAME_REGISTRY[game_name]["power_ups"][power_up_name]
            for power_up_name in GAME_REGISTRY[game_name]["power_ups"]
            if power_up_name in power_ups
        ]

        self.unavailable_power_ups = []

        self.compute_cdf()

    def compute_cdf(self):
        """Computes the cdf from a list of power_ups"""
        # Compute the Probability Density Function
        self.pdf = [
            self.available_power_ups[id]["spawn_weight"] + 0.0
            for id, power_up_name in enumerate(self.power_up_names)
            if not power_up_name in self.unavailable_power_ups
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
        pass

    def spawn_power_up(self, rng: random.Random, position: tuple):
        """Sample then spawn a random power_up at the given position"""
        pass

    def deactivate_power_up(self, power_up):
        """Deactivate given power up if active"""
        pass
