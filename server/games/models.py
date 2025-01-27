from django.db import models

class Matches(models.Model):

    GAME_CHOICES = {
        "PONG": "pong"
    }

    GAME_MODE_CHOICES = {
        "MULTI_PLAYER_PONG": "multy_player_pong"
    }

    MODIFIERS_GAME_CHOICES = {

    }

    id = models.UUIDField(primary_key=True)
    game = models.CharField(choices=GAME_CHOICES, max_length=30)
    gameMode = models.CharField(choices=GAME_MODE_CHOICES, max_length=30)
    modifiers = models.JSONField(default={})
    result = models.CharField(choices=MODIFIERS_GAME_CHOICES, max_length=30)
    #tournament =



