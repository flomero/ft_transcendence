from django.shortcuts import render

# Create your views here.
def game_selection_view(request):
    """Render the game selection page."""
    return render(request, "games/game_selection.html")

def pong_page_view(request):
    """Render the pong page."""
    return render(request, "games/pong.html")