# api/pages/auth_page.py

import re
import jwt
from datetime import datetime, timedelta
from ninja import Router, Schema
from typing import Optional
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password, make_password
from api.models.models_users import LibraryUser
from api.factories.user_factory import UserFactory

router = Router()
JWT_EXP_DELTA_SECONDS = 86400  # 1 day

class AuthSchema(Schema):
    action: str
    username: str
    password: str
    email: Optional[str] = None
    role: Optional[str] = None

class AuthResponseSchema(Schema):
    success: bool
    message: str
    token: Optional[str] = None

# Validator Functions
def is_valid_username(username: str) -> bool:
    return bool(re.fullmatch(r'^\w{5,20}$', username))

def is_valid_password(password: str) -> bool:
    return (
        len(password) >= 8 and
        re.search(r'[A-Z]', password) and
        re.search(r'[a-z]', password) and
        re.search(r'\d', password) and
        re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
    )

def is_valid_email(email: str) -> bool:
    return bool(re.fullmatch(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email))

def generate_jwt(user):
    payload = {
        'user_id': user.id,
        'username': user.name,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token

class LoginPage:
    def get_login(self, request):
        return {"message": "Login page from backend!"}
    
    def auth(self,request, data: AuthSchema):
        action = data.action.lower().strip()
        username = data.username.strip()
        password = data.password
        email = data.email.strip() if data.email else None
        role = data.role.strip().lower() if data.role else None
        print(username)
        print(password)
        print(email)
        print(role)

        if action == "register":
            if not is_valid_username(username):
                return {"success": False, "message": "Username must be 5-20 characters and contain only letters, numbers, and underscores."}
            if not email or not is_valid_email(email):
                return {"success": False, "message": "Please provide a valid email address."}
            if not is_valid_password(password):
                return {"success": False, "message": "Password must include uppercase, lowercase, number, special char."}
            if role not in UserFactory._user_map.keys():
                return {"success": False, "message": f"Invalid role. Available roles: {list(UserFactory._user_map.keys())}"}
            if LibraryUser.objects.filter(name=username).exists():
                return {"success": False, "message": "Username already exists."}

            try:
                UserFactory.create_user(role, username, email, password)
                hashed_password = make_password(password)
                LibraryUser.objects.create(
                    name=username,
                    email=email,
                    password_hash=hashed_password,
                    role=role.capitalize()
                )
                return {"success": True, "message": "Registration successful! Please log in."}
            except Exception as e:
                return {"success": False, "message": f"Registration error: {str(e)}"}

        elif action == "login":
            try:
                user = LibraryUser.objects.get(name=username)
            except LibraryUser.DoesNotExist:
                return {"success": False, "message": "Invalid username or password."}

            if not check_password(password, user.password_hash):
                return {"success": False, "message": "Invalid username or password."}

            try:
                token = generate_jwt(user)
                return {"success": True, "message": "Login successful!", "token": token}
            except Exception as e:
                return {"success": False, "message": f"Error generating token: {str(e)}"}

        return {"success": False, "message": "Invalid action. Use 'login' or 'register'."}
