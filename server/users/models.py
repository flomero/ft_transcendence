import os

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.timezone import now


def validate_file_size(file):
	max_size_kb = 5120  # 5 MB
	if file.size > max_size_kb * 1024:
		raise ValidationError(f"File size should not exceed {max_size_kb} KB.")


def validate_image_type(file):
	valid_image_types = ['.jpeg', '.jpg', '.png', '.gif']
	ext = os.path.splitext(file.name)[1].lower()
	if ext not in valid_image_types:
		raise ValidationError('Unsupported file type.')


class User(AbstractUser):
	display_name = models.CharField(max_length=100, blank=True, null=True)
	profile_pic = models.FileField(upload_to='profile_pics/', blank=True, null=True,
								   validators=[validate_file_size, validate_image_type])


class OAuthToken(models.Model):
	user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='oauth_token')
	refresh_token = models.CharField(max_length=255, blank=True, null=True)
	access_token = models.CharField(max_length=255, blank=True, null=True)
	expires_at = models.DateTimeField(null=True, blank=True)  # Token expiration time

	def is_expired(self):
		return self.expires_at <= now() if self.expires_at else True
