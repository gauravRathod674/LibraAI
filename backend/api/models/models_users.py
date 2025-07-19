from django.db import models
from api.factories.user_roles import *

USER_ROLE_CHOICES = [
    ("Student", "Student"),
    ("Researcher", "Researcher"),
    ("Faculty", "Faculty"),
    ("Guest", "Guest"),
    ("Librarian", "Librarian"),
]

ROLE_CLASS_MAPPING = {
    "Student": StudentUser,
    "Researcher": ResearcherUser,
    "Faculty": FacultyUser,
    "Guest": GuestUser,
    "Librarian": LibrarianUser,
}


class LibraryUser(models.Model):
    """
    Minimal user model for LibraAI.
    Stores data essential for authentication, authorization, and tracking user actions.
    """

    profile_photo = models.ImageField(
        upload_to="profile_photos/",
        null=True,
        blank=True,
        default="profile_photos/profile_photo.png",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=USER_ROLE_CHOICES)
    current_loans = models.ManyToManyField(
        "api.LibraryItem", blank=True, related_name="borrowers"
    )

    def __str__(self):
        return f"{self.name} ({self.role})"

    def get_role_instance(self):
        role_class = ROLE_CLASS_MAPPING.get(self.role)
        return role_class(self.name, self.email, self.password_hash)

    def get_borrow_limit(self):
        return self.get_role_instance().get_borrow_limit()

    def get_borrow_duration(self):
        return self.get_role_instance().get_borrow_duration()

    def can_borrow(self, item):
        if self.role == "Guest":
            return False
        if item.item_type == "ResearchPaper" and self.role not in [
            "Faculty",
            "Researcher",
        ]:
            return False
        return True
