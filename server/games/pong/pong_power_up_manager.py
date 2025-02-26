import random
from ..power_up_manager import PowerUpManager
from ..game_registry import GAME_REGISTRY


class PongPowerUpManager(PowerUpManager):

    def __init__(self, power_ups, game_mode):
        super().__init__(power_ups, "pong", game_mode)

        self.default_power_up_size = GAME_REGISTRY["pong"]["game_modes"][game_mode]["default_power_up_settings"]["size"]
        self.exclusive_power_ups = GAME_REGISTRY["pong"]["game_modes"][game_mode]["default_power_up_settings"]["exclusive_power_ups"]

    def random_power_up(self, rng: random.Random):
        """Sample a random power_up using the CDF"""
        if len(self.cdf) <= 0:
            return None

        rnd = rng.random()
        for i, cumul in enumerate(self.cdf):
            if rnd < cumul:
                return self.power_up_names[i]

        # fallback
        return self.power_up_names[rng.randint(0, len(self.power_up_names))]

    def spawn_power_up(self, rng: random.Random, position: tuple):
        """Sample then spawn a random power_up at the given position"""
        power_up = self.random_power_up(rng)
        if not power_up:
            print(f"Can't spawn any power_up")
            return False

        if power_up in self.exclusive_power_ups:
            self.unavailable_power_ups.append(power_up)
            self.compute_cdf()

        self.spawned_power_ups.append(
            {
                "x": position[0],
                "y": position[1],
                "size": self.default_power_up_size,
                "type": power_up,
                "visible": True
            }
        )

        return True

    def deactivate_power_up(self, power_up):
        """Deactivate given power up if active"""
        if power_up in self.active_power_ups:
            self.active_power_ups.remove(power_up)
            if power_up.name in self.unavailable_power_ups:
                self.unavailable_power_ups.remove(power_up.name)
                self.compute_cdf()