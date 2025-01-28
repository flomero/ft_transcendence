from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	display_name = models.CharField(max_length=100, blank=True, null=True)
	profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)