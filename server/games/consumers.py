import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_registry import GAME_REGISTRY

class GameConsumer(AsyncWebsocketConsumer):
    game = None
    game_class = "MultiplayerPong"
    modifiers = []
    player_count = 2
    running = False

    async def connect(self):
        """Accept WebSocket connection."""
        await self.accept()

    async def receive(self, text_data):
        """Handle incoming WebSocket messages (game selection, modifiers, actions)."""
        data = json.loads(text_data)

        print(f"Received: {data}")

        # Game Selection (fallback = pong)
        game_name = data.get("game", "pong")
        if game_name not in GAME_REGISTRY:
            print(f"Unknown game: {game_name}, defaulting to Pong")
            game_name = "pong"

        # Game Mode Selection (fallback multiplayer_<game>)
        mode_name = data.get("game_mode", f"multiplayer_{game_name}")
        game_modes = GAME_REGISTRY[game_name]["game_modes"]
        if mode_name in game_modes:
            self.game_class = game_modes[mode_name]["class"]
        else:
            print(f"Unknown mode: {mode_name}, defaulting to {list(game_modes.keys())[0]}")
            self.game_class = list(game_modes.values())[0]["class"]  # Default to first variant

        # Modifier Selection (with fallback to [])
        modifier_names = data.get("modifiers", [])
        available_game_modifiers = GAME_REGISTRY[game_name]["game_modifiers"]
        print(f"available modifiers:\n{available_game_modifiers}")
        self.game_modifiers = [available_game_modifiers[mod]["class"]() for mod in modifier_names if mod in available_game_modifiers]

        self.power_ups = data.get("power_ups", [])
        # power_ups_names = data.get("power_ups", [])
        # available_power_ups = GAME_REGISTRY[game_name]["power_ups"]
        # print(f"available power_ups:\n{available_power_ups}")
        # self.power_ups = [available_power_ups[mod]["class"]() for mod in power_ups_names if mod in available_power_ups]

        self.player_count = data.get("player_count")

        # Start Game if Requested
        if data.get("start_game"):
            await self.start_game()

        # Handle Player Actions
        if data.get("action") and self.running:
            print(f"Received: {data.get('action')}")
            self.game.handle_action(data["action"])

    async def start_game(self):
        """Start a new game instance with the selected settings."""
        print(f"\n\nCreating the game w/:")
        print(f" |- game_modifiers: {self.game_modifiers}")
        print(f" |- power_ups: {self.power_ups}")
        print(f"\n")
        self.game = self.game_class(player_count=self.player_count, modifiers=self.game_modifiers, power_ups=self.power_ups)
        self.game.start_game()
        self.running = True
        asyncio.create_task(self.run_game_loop())

    async def run_game_loop(self):
        """Game loop: Update game state and send it to clients."""
        update_count = 0
        while self.running:
            self.game.update()
            update_count += 1
            await self.send(json.dumps(self.game.get_state_snapshot()))
            await asyncio.sleep(0.03)

            # if update_count > 160:
            #     break

            if  self.game.balls[0]["x"] < 0 or self.game.balls[0]["x"] > 100 or \
                self.game.balls[0]["y"] < 0 or self.game.balls[0]["y"] > 100:
                self.game.reset_ball(ball_id=0)
        print("end of game_loop")
