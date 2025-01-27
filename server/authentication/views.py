import logging

import requests
from django.conf import settings
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.shortcuts import redirect, render

from .models import OAuthToken
from users.models import User

logger = logging.getLogger(__name__)


def oauth_login(request):
	"""Redirect to 42 OAuth2 authorization page."""
	url = f"{settings.OAUTH2_AUTHORIZE_URL}?client_id={settings.OAUTH2_CLIENT_ID}&redirect_uri={settings.OAUTH2_REDIRECT_URI}&response_type=code"
	return redirect(url)


def oauth_callback(request):
	"""Handle the callback from 42."""
	# Get the authorization code
	code = request.GET.get('code')
	if not code:
		return render(request, 'auth/error.html', {"error": "No code provided by 42."})

	# Exchange the code for an access token
	token_data = {
		'grant_type': 'authorization_code',
		'client_id': settings.OAUTH2_CLIENT_ID,
		'client_secret': settings.OAUTH2_CLIENT_SECRET,
		'code': code,
		'redirect_uri': settings.OAUTH2_REDIRECT_URI,
	}
	token_response = requests.post(settings.OAUTH2_TOKEN_URL, data=token_data)
	if token_response.status_code != 200:
		return render(request, 'auth/error.html', {"error": "Failed to fetch access token."})

	logger.warning(f"Token response: {token_response.json()}")

	access_token = token_response.json().get('access_token')

	# Fetch user data from 42 API
	headers = {'Authorization': f'Bearer {access_token}'}
	user_response = requests.get(settings.OAUTH2_API_URL, headers=headers)
	if user_response.status_code != 200:
		return render(request, 'auth/error.html', {"error": "Failed to fetch user data."})

	user_data = user_response.json()
	logger.warning(f"User data: {user_data}")

	# Extract user information
	email = user_data.get('email')
	username = user_data.get('login')

	# Find or create a user in the database
	user, created = User.objects.get_or_create(username=username, defaults={"email": email})
	if created:
		user.set_unusable_password()  # You won't use passwords with 42 OAuth

		# Save the profile picture
		pic_url = user_data.get('image', {}).get('versions', {}).get('medium')
		if pic_url:
			pic_response = requests.get(pic_url)
			if pic_response.status_code == 200:
				profile_pic = pic_response.content
				try:
					user.profile_pic.save(f"{username}_profile_pic.jpg", ContentFile(profile_pic), save=False)
					user.full_clean()  # This will run the validators
				except ValidationError as e:
					logger.error(f"Validation error: {e}")
					# TODO Handle the validation error (e.g., set a default image, notify the user, etc.)
					user.profile_pic = None  # Or set a default image

		user.save()

	save_oauth_token(token_response, user)

	# Log the user in
	login(request, user)

	return redirect('/')


def oauth_logout(request):
	"""Log the user out."""
	from django.contrib.auth import logout
	logout(request)
	return redirect('/')


def save_oauth_token(token_response, user):
	oauth_token, _ = OAuthToken.objects.update_or_create(user=user)
	oauth_token.update_from_token_response(token_response)
