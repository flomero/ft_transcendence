from django.urls import path
from .views import pong_page_view, ttt_page_view

urlpatterns = [
    path('', pong_page_view, name="pong"),              # Pong page
    path('ttt/', ttt_page_view, name="ttt"),            # Enhanced TicTacToe (ttt) page
]
