from django.db import models
from django.utils import timezone
from .models_items import LibraryItem
from .models_users import LibraryUser
from datetime import timedelta

class BorrowingTransaction(models.Model):
    """
    Records a borrowing (and return) event in the library.

    Key minimal data includes:
      - user: The LibraryUser borrowing the item.
      - library_item: The item that was borrowed.
      - borrow_date: When the transaction occurred.
      - due_date: Expected return time (based on borrowing policies).
      - return_date: Actual return time (if applicable).
      - status: Current status (active, completed, or overdue).
    """

    STATUS_ACTIVE = "Active"
    STATUS_COMPLETED = "Completed"
    STATUS_OVERDUE = "Overdue"

    TRANSACTION_STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_OVERDUE, "Overdue"),
    ]

    user = models.ForeignKey(
        LibraryUser, on_delete=models.CASCADE, related_name="transactions"
    )
    library_item = models.ForeignKey(
        LibraryItem, on_delete=models.CASCADE, related_name="transactions"
    )
    borrow_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    return_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=TRANSACTION_STATUS_CHOICES, default=STATUS_ACTIVE
    )

    def __str__(self):
        return f"Transaction {self.id}: {self.user.name} - {self.library_item}"

    def complete_transaction(self):
        from api.states.item_states import AvailableState
        self.status = "Completed"
        self.return_date = timezone.now()
        self.save()

        item = self.library_item

        # 📦 Increase available copies for PrintedBook
        if item.item_type == "PrintedBook":
            printed = item.printed_book
            printed.no_of_books_available += 1
            printed.save()

            # If even 1 copy is now available, mark as Available
            item.change_state(AvailableState())

        item.save()

        # Notify next reserver
        item.notify_next_in_queue()


    def calculate_late_fee(self):
        """Calculate the fine based on the overdue duration."""
        if self.return_date and self.return_date > self.due_date:
            delay = self.return_date - self.due_date
            return delay.total_seconds() / 3600
        return 0
