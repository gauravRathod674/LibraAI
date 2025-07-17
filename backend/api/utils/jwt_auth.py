from ninja.security import HttpBearer
import jwt
from django.conf import settings
from api.models.models_users import LibraryUser

class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")

            if user_id is None:
                return None

            try:
                user = LibraryUser.objects.get(id=user_id)
                request.user = user
                return user
            except LibraryUser.DoesNotExist:
                return None

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
