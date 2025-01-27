import logging

import requests
from django.conf import settings
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.shortcuts import redirect, render

from users.models import User
from .models import OAuthToken

logger = logging.getLogger(__name__)


# Public Views
def oauth_login(request):
	"""Redirect to 42 OAuth2 authorization page."""
	url = f"{settings.OAUTH2_AUTHORIZE_URL}?client_id={settings.OAUTH2_CLIENT_ID}&redirect_uri={settings.OAUTH2_REDIRECT_URI}&response_type=code"
	return redirect(url)


def oauth_callback(request):
	"""Handle the callback from 42."""
	code = _get_authorization_code(request)
	if not code:
		return _render_error(request, "No code provided by 42.")

	oauth_token_data = _exchange_code_for_oauth_tokens(code)
	if not oauth_token_data:
		return _render_error(request, "Failed to fetch access token.")

	user_data = _fetch_user_data(oauth_token_data)
	if not user_data:
		return _render_error(request, "Failed to fetch user data.")

	user = _find_or_create_user(user_data)
	_save_profile_picture(user, user_data)

	_save_oauth_token(oauth_token_data, user)

	login(request, user)

	return redirect('/')


def oauth_logout(request):
	"""Log the user out."""
	from django.contrib.auth import logout
	logout(request)
	return redirect('/')


# Helper Functions
def _get_authorization_code(request):
	"""Extract the authorization code from the request."""
	return request.GET.get('code')


def _exchange_code_for_oauth_tokens(code):
	"""Exchange the authorization code for an access token."""
	token_data = {
		'grant_type': 'authorization_code',
		'client_id': settings.OAUTH2_CLIENT_ID,
		'client_secret': settings.OAUTH2_CLIENT_SECRET,
		'code': code,
		'redirect_uri': settings.OAUTH2_REDIRECT_URI,
	}
	token_response = requests.post(settings.OAUTH2_TOKEN_URL, data=token_data)
	if token_response.status_code != 200:
		logger.error(f"Token exchange failed: {token_response.status_code}, {token_response.text}")
		return None

	return token_response


def _fetch_user_data(oauth_token_data):
	"""Fetch user data from 42 API."""
	headers = {'Authorization': f'Bearer {oauth_token_data.json().get("access_token")}'}
	user_response = requests.get(settings.OAUTH2_API_URL, headers=headers)
	if user_response.status_code != 200:
		logger.error(f"Failed to fetch user data: {user_response.status_code}, {user_response.text}")
		return None

	return user_response.json()


def _find_or_create_user(user_data):
	"""Find or create a user in the database."""
	email = user_data.get('email')
	username = user_data.get('login')

	user, created = User.objects.get_or_create(
		username=username,
		defaults={"email": email}
	)
	if created:
		logger.info(f"Created new user: {username}")
		user.set_unusable_password()
		user.save()
	return user


def _save_profile_picture(user, user_data):
	"""Save the user's profile picture."""
	if user.profile_pic:
		return

	pic_url = user_data.get('image', {}).get('versions', {}).get('medium')
	if not pic_url:
		return

	pic_response = requests.get(pic_url)
	if pic_response.status_code != 200:
		logger.error(f"Failed to fetch profile picture from {pic_url}")
		return

	profile_pic = pic_response.content
	try:
		user.profile_pic.save(f"{user.username}.jpg", ContentFile(profile_pic), save=False)
		user.full_clean()  # Validate the model
	except ValidationError as e:
		logger.error(f"Validation error: {e}")
		user.profile_pic = None

	logger.info(f"Saved profile picture for {user.username}")
	user.save()


def _save_oauth_token(token_response, user):
	"""Save the OAuth token to the database."""
	oauth_token, _ = OAuthToken.objects.update_or_create(user=user)
	oauth_token.update_from_token_response(token_response)


def _render_error(request, error_message):
	"""Render an error page."""
	return render(request, 'auth/error.html', {"error": error_message})
