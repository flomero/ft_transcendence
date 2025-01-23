import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .base_game import GAME_REGISTRY

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Accept WebSocket connection."""
        self.game_class = None  # No game selected yet
        self.modifiers = []
        self.running = False
        await self.accept()

    async def receive(self, text_data):
        """Handle incoming WebSocket messages (game selection, modifiers, actions)."""
        data = json.loads(text_data)

        # Game Selection (fallback = pong)
        game_name = data.get("game", "pong")
        if game_name not in GAME_REGISTRY:
            print(f"Unknown game: {game_name}, defaulting to Pong")
            game_name = "pong"

        # Game Mode Selection (fallback default_<game>)
        mode_name = data.get("game_mode", f"default_{game_name}")
        game_variants = GAME_REGISTRY[game_name]["variants"]
        if mode_name in game_variants:
            self.game_class = game_variants[mode_name]
        else:
            print(f"Unknown mode: {mode_name}, defaulting to {list(game_variants.keys())[0]}")
            self.game_class = list(game_variants.values())[0]  # Default to first variant

        # Modifier Selection (with fallback to [])
        modifier_names = data.get("modifiers", [])
        available_modifiers = GAME_REGISTRY[game_name]["modifiers"]
        self.modifiers = [available_modifiers[mod]() for mod in modifier_names if mod in available_modifiers]

        # Start Game if Requested
        if data.get("start_game"):
            await self.start_game()

        # Handle Player Actions
        if data.get("action") and self.running:
            self.game.handle_action(data["action"])

    async def start_game(self):
        """Start a new game instance with the selected settings."""
        self.game = self.game_class(modifiers=self.modifiers)
        self.running = True
        asyncio.create_task(self.run_game_loop())

    async def run_game_loop(self):
        """Game loop: Update game state and send it to clients."""
        while self.running:
            self.game.update()
            await self.send(json.dumps(self.game.get_state()))
            await asyncio.sleep(0.03)
