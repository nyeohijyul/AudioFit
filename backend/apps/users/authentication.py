import os
import logging
from pathlib import Path
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from decouple import Config, RepositoryEnv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    config = Config(RepositoryEnv(env_path))
else:
    from decouple import config

from django.conf import settings
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)


class FirebaseUser:
    def __init__(self, decoded_token):
        self.uid = decoded_token.get('uid')
        self.email = decoded_token.get('email')
        self.name = decoded_token.get('name')
        self.is_authenticated = True

    def __str__(self):
        return self.uid or 'firebase_user'


class FirebaseAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != self.keyword.lower().encode():
            return None
        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. No credentials provided.')
        if len(auth_header) > 2:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. Token string should not contain spaces.')

        token = auth_header[1].decode()
        try:
            app = self.get_firebase_app()
            decoded_token = firebase_auth.verify_id_token(token, app=app)
        except Exception as exc:
            logger.exception('Firebase token verification failed.')
            raise exceptions.AuthenticationFailed('Firebase token verification failed.') from exc

        user = FirebaseUser(decoded_token)
        return (user, token)

    def authenticate_header(self, request):
        return self.keyword

    def get_firebase_app(self):
        if not firebase_admin._apps:
            import json
            firebase_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
            if firebase_json:
                try:
                    cred = credentials.Certificate(json.loads(firebase_json))
                except Exception as e:
                    logger.exception('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env variable.')
                    raise exceptions.AuthenticationFailed('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format.') from e
            else:
                service_account = config('FIREBASE_SERVICE_ACCOUNT_PATH', default=os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', ''))
                if service_account:
                    service_account_path = Path(service_account)
                    if not service_account_path.is_absolute():
                        service_account_path = settings.BASE_DIR / service_account_path
                    cred = credentials.Certificate(str(service_account_path))
                else:
                    cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        return firebase_admin.get_app()
