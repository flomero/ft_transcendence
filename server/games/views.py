from django.shortcuts import render

# Create your views here.
def pong_page_view(request):
    """Render the pong page."""
    return render(request, "games/pong.html")

def ttt_page_view(request):
    """Render the ttt page."""
    return render(request, "games/ttt.html")