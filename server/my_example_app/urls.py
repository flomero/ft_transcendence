# server/my_app/urls.py
from django.urls import path

from . import views

urlpatterns = [
	path('', views.entry_list_create, name='entry_list_create'),
	path('delete/<int:entry_id>/', views.delete_entry, name='delete_entry'),
]
