from api.models.models_users import LibraryUser
from api.models.models_items import LibraryItem
from api.singleton.singleton import Singleton

class AccessControlManager(Singleton):
    """
    Singleton manager for role-based access control decisions.
    Centralizes permission checks (e.g., who can borrow what).
    """

    def can_access(self, user: LibraryUser, item: LibraryItem):
        return user.can_borrow(item)

    def is_restricted(self, item: LibraryItem):
        return item.item_type == 'ResearchPaper'

    def can_edit_catalog(self, user: LibraryUser):
        return user.role == 'Librarian'

    def can_reserve(self, user: LibraryUser, item: LibraryItem):
        if user.role == 'Guest':
            return False
        return True
