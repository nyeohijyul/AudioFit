import os
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from rest_framework import authentication, exceptions


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
            raise exceptions.AuthenticationFailed('Firebase token verification failed.') from exc

        user = FirebaseUser(decoded_token)
        return (user, token)

    def authenticate_header(self, request):
        return self.keyword

    def get_firebase_app(self):
        if not firebase_admin._apps:
            service_account = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            if service_account:
                cred = credentials.Certificate(service_account)
            else:
                cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        return firebase_admin.get_app()
