from ninja.security import HttpBearer
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from ninja.errors import HttpError

User = get_user_model()

class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        print("Received token:", token)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            user = User.objects.get(id=user_id)
            
            # 🔧 Manually attach the user to request
            request.user = user
            return user
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            raise HttpError(401, "Invalid or expired token")