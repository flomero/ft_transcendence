from django.urls import path
from .views import game_selection_view, pong_page_view

urlpatterns = [
    # path('', game_selection_view, name="game_selection"),  # Game selection page
    path('', pong_page_view, name="pong"),            # Pong page
]
