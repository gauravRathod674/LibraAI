from .user_roles import *

class UserFactory:
    _user_map = {
        "student": StudentUser,
        "faculty": FacultyUser,
        "researcher": ResearcherUser,
        "guest": GuestUser,
        "librarian": LibrarianUser,
    }

    @staticmethod
    def register_role(role_type, role_class):
        UserFactory._user_map[role_type.lower()] = role_class

    @staticmethod
    def create_user(role_type, name, email, password):
        role_type = role_type.lower()
        if role_type in UserFactory._user_map:
            return UserFactory._user_map[role_type](name, email, password)
        else:
            raise ValueError(f"Unknown role type: {role_type}")