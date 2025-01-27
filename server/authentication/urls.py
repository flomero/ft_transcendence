from django.urls import path

from .views import oauth_login, oauth_callback, oauth_logout

urlpatterns = [
	path('login/', oauth_login, name='oauth_login'),
	path('callback/', oauth_callback, name='oauth_callback'),
	path('logout/', oauth_logout, name='oauth_logout'),
]
