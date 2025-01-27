import logging

import requests
from datetime import timedelta
from django.utils.timezone import now, localtime
from django.conf import settings

logger = logging.getLogger(__name__)

def refresh_access_token(oauth_token):
	refresh_token = oauth_token.refresh_token

	if not refresh_token:
		logger.error("No refresh token found.")
		raise ValueError("No refresh token found.")

	response = requests.post(
		settings.OAUTH2_TOKEN_URL,
		data={
			'grant_type': 'refresh_token',
			'client_id': settings.OAUTH2_CLIENT_ID,
			'client_secret': settings.OAUTH2_CLIENT_SECRET,
			'refresh_token': refresh_token,
		}
	)

	if response.status_code != 200:
		logger.error("Failed to refresh access token.")
		raise ValueError("Failed to refresh access token.")

	oauth_token.update_from_token_response(response)


class RefreshTokenMiddleware:
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		if request.user.is_authenticated and hasattr(request.user, 'oauth_token'): # TODO maybe handle case where user has no oauth_token
			oauth_token = request.user.oauth_token

			# Check if the access token is expired
			if oauth_token.is_expired():
				logger.info("Access token is expired. Refreshing...")
				refresh_access_token(oauth_token)

		return self.get_response(request)