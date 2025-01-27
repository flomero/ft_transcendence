import logging

import requests
from django.conf import settings
from django.contrib.auth import logout

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
		return False

	oauth_token.update_from_token_response(response)
	return True


class RefreshTokenMiddleware:
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		if request.user.is_authenticated:
			if not hasattr(request.user, 'oauth_token'):
				logger.error("No OAuth token found for user %s.", request.user)
				logout(request)

			oauth_token = request.user.oauth_token

			# Check if the access token is expired
			if oauth_token.is_expired():
				logger.info("Access token is expired for user %s. Refreshing ...", request.user)
				if not refresh_access_token(oauth_token):
					logger.error("Failed to refresh access token. Logging out user.")
					logout(request)
				# TODO: Redirect to login page with a message

		return self.get_response(request)