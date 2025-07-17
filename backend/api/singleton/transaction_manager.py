
from api.models.models_transactions import BorrowingTransaction
from api.models.models_users import LibraryUser
from api.models.models_items import LibraryItem
from api.singleton.singleton import Singleton
from django.utils import timezone
from api.states.item_states import CheckedOutState, AvailableState

class TransactionManager(Singleton):
    """
    Centralized manager for borrowing, returning, and revoking transactions.
    Inherits from Singleton to ensure only one instance handles all transactions globally.
    """

    def borrow_item(self, user: LibraryUser, item: LibraryItem):
        if not user.can_borrow(item):
            return False, "User is not authorized to borrow this item."

        if item.availability_status != 'Available':
            return False, f"Item is not available (current status: {item.availability_status})."

        borrow_duration_days = user.get_borrow_duration()

        transaction = BorrowingTransaction.objects.create(
            user=user,
            library_item=item,
            due_date=timezone.now() + timezone.timedelta(days=borrow_duration_days),
        )

        user.current_loans.add(item)
        user.save()

        # Directly set to CheckedOutState
        item.change_state(CheckedOutState())

        return True, f"Successfully borrowed '{item.title}'."

    def return_item(self, user: LibraryUser, item: LibraryItem):
        tx = BorrowingTransaction.objects.filter(
            user=user, library_item=item, status=BorrowingTransaction.STATUS_ACTIVE
        ).order_by("-borrow_date").first()

        if not tx:
            return False, "No active transaction found to return."

        tx.complete_transaction()
        user.current_loans.remove(item)
        user.save()

        return True, f"Successfully returned '{item.title}'."

    def revoke_borrow(self, user: LibraryUser, item: LibraryItem):
        tx = BorrowingTransaction.objects.filter(
            user=user, library_item=item, status=BorrowingTransaction.STATUS_ACTIVE
        ).order_by("-borrow_date").first()

        if not tx:
            return False, "No active transaction to revoke."

        if timezone.now() - tx.borrow_date > timezone.timedelta(hours=2):
            return False, "Revoke period expired."

        tx.delete()
        user.current_loans.remove(item)
        user.save()
        # Directly set to AvailableState
        item.change_state(AvailableState())

        return True, f"Borrow of '{item.title}' has been revoked."
