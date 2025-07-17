from django.db import models
from api.states.item_states import AvailableState, CheckedOutState, ReservedState, UnderReviewState
from api.observer.user_observer import UserObserver
from api.observer.observer import Subject
from django.utils import timezone
from api.decorators.decorators import *
from api.models.models_users import *

# Observer Setup
subject = Subject()
subject.attach(UserObserver())

# -------------------------------------------------------------------
# Constants for Status and Item Types
# -------------------------------------------------------------------
AVAILABILITY_STATUS_CHOICES = [
    ('Available', 'Available'),
    ('CheckedOut', 'Checked Out'),
    ('Reserved', 'Reserved'),
    ('UnderReview', 'Under Review'),
]

LIBRARY_ITEM_TYPE_CHOICES = [
    ('EBook', 'E-Book'),
    ('PrintedBook', 'Printed Book'),
    ('ResearchPaper', 'Research Paper'),
    ('Audiobook', 'Audiobook'),
    ('Journal', 'Journal'),
]

STATE_MAPPING = {
    'Available': AvailableState,
    'CheckedOut': CheckedOutState,
    'Reserved': ReservedState,
    'UnderReview': UnderReviewState
}
# -------------------------------------------------------------------
# Base Library Item Model (Inheritance, Abstraction, Encapsulation)
# -------------------------------------------------------------------
class LibraryItem(models.Model):
    """
    Base model for all library items.
    Implements common properties such as title, authors, publication date, genre, status, etc.
    """
    title = models.CharField(max_length=255)
    authors = models.CharField(max_length=255)  # For simplicity; may later use ManyToManyField.
    publication_date = models.DateField()
    genre = models.CharField(max_length=100)
    availability_status = models.CharField(
        max_length=20, choices=AVAILABILITY_STATUS_CHOICES, default='Available'
    )
    digital_source = models.URLField(blank=True, null=True)
    item_type = models.CharField(
        max_length=20, choices=LIBRARY_ITEM_TYPE_CHOICES, default='PrintedBook'
    )
    
    def __str__(self):
        return f"{self.title} ({self.item_type})"
    
    def get_details(self):
        """Return a summary string of the item metadata."""
        return f"{self.title} by {self.authors} (Published: {self.publication_date}) - {self.availability_status}"

    def update_availability(self, status):
        """Update the availability status of the item."""
        self.availability_status = status
        self.save()

    def get_state(self):
        state_class = STATE_MAPPING.get(self.availability_status, AvailableState)
        return state_class()

    def change_state(self, new_state):
        self.availability_status = new_state.get_status_name()
        self.save()

    @property
    def state(self):
        """Returns current state instance based on `availability_status`."""
        return self.get_state()


    def borrow(self, user):
        self.state.borrow(self, user)

    def reserve(self, user):
        self.state.reserve(self, user)

    def return_item(self, user):
        self.state.return_item(self, user)

    @classmethod
    def add_to_reservation_queue(cls, item, user, duration_days=7):
        existing = cls.objects.filter(user=user, library_item=item, status="Active").first()
        if existing:
            return existing  # Prevent duplicate
        expiry = timezone.now() + timezone.timedelta(days=duration_days)
        return cls.objects.create(user=user, library_item=item, expiry_date=expiry)
    
    def cancel_reservation(self, user : LibraryUser):
        from .models_reservations import Reservation 
        Reservation.cancel_reservation(self, user)
        print(f"{user.name} removed from reservation queue for {self.title}")

    def notify_next_in_queue(self):
        from .models_reservations import Reservation 
        next_reservation = Reservation.get_next_user_in_queue(self)
        if next_reservation:
            subject.notify("book_returned_notify_next", {
                "queue_user": next_reservation.user,
                "item": self
            })


    def has_reservations(self):
        from .models_reservations import Reservation 
        return Reservation.get_next_user_in_queue(self) is not None

    def is_first_in_queue(self, user):
        from .models_reservations import Reservation 
        next_reservation = Reservation.get_next_user_in_queue(self)
        return next_reservation and next_reservation.user == user

    @with_due_date_reminder
    def process_borrow_return(self, action, user : LibraryUser):
        from .models_transactions import BorrowingTransaction
        from django.utils import timezone
        from datetime import timedelta
        from api.states.item_states import AvailableState

        print(f"LOG: {action} -> {self.title} by {user.name}")

        if action == "borrow":
            # Borrowing logic
            if user.current_loans.count() >= user.get_borrow_limit():
                raise Exception(f"{user.name} has reached the borrow limit.")

            if not user.can_borrow(self):
                raise Exception(f"{user.name} is not allowed to borrow this item.")

            borrow_duration_days = user.get_borrow_duration()

            # 📦 Check PrintedBook availability
            if self.item_type == "PrintedBook":
                printed = self.printed_book  # thanks to related_name='printed_book'
                if printed.no_of_books_available == 0:
                    raise Exception("No printed copies available.")
                
                printed.no_of_books_available -= 1
                printed.save()

                # If zero copies left, mark unavailable
                if printed.no_of_books_available == 0:
                    self.change_state(CheckedOutState())

            # 📄 Create Transaction
            tx = BorrowingTransaction.objects.create(
                user=user,
                library_item=self,
                due_date=timezone.now() + timedelta(days=borrow_duration_days),
            )

            user.current_loans.add(self)
            user.save()
            return tx


        elif action == "return":
            # Returning logic
            tx = BorrowingTransaction.objects.filter(
                user=user, library_item=self, status=BorrowingTransaction.STATUS_ACTIVE
            ).order_by("-borrow_date").first()

            if tx:
                tx.complete_transaction()
                user.current_loans.remove(self)
                user.save()
                return tx
            else:
                raise Exception("No active transaction to return.")

        elif action == "revoke":
            # Revoke logic (within 2 hours only)
            tx = BorrowingTransaction.objects.filter(
                user=user, library_item=self, status=BorrowingTransaction.STATUS_ACTIVE
            ).order_by("-borrow_date").first()

            if not tx:
                raise Exception("No active transaction to revoke.")

            if timezone.now() - tx.borrow_date > timedelta(hours=2):
                raise Exception("Revoke period expired.")

            # Delete transaction and reset state
            tx.delete()
            user.current_loans.remove(self)
            user.save()
            self.change_state(AvailableState())

            print(f"LOG: Borrowing of '{self.title}' by {user.name} has been revoked.")
            return None

        else:
            raise Exception(f"Invalid action: {action}")




# -------------------------------------------------------------------
# Specialized Library Item Models for Persistent Data
# -------------------------------------------------------------------

class EBookModel(models.Model):
    """
    E-Book model extends LibraryItem via a one-to-one relationship.
    Includes additional attributes such as file format and download link.
    """
    library_item = models.OneToOneField(
        LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='ebook'
    )
    file_format = models.CharField(max_length=20)
    download_link = models.URLField()

    def open_book(self):
        return f"Opening '{self.library_item.title}' as a {self.file_format} file."

    def __str__(self):
        return f"E-Book: {self.library_item.title}"


class PrintedBookModel(models.Model):
    """
    Printed Book model for physical copies.
    Includes extra fields: location, copy number, number available, barcode, and physical condition.
    """
    library_item = models.OneToOneField(
        LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='printed_book'
    )
    location = models.CharField(max_length=100)
    copy_number = models.IntegerField()
    no_of_books_available = models.PositiveIntegerField(default=1)
    barcode = models.CharField(max_length=100, unique=True)
    physical_condition = models.CharField(max_length=20, default='New')  # Can be extended with choices.

    def mark_physical_condition(self, condition_note):
        if not self.library_item:
            raise Exception("Related Library Item not found.")
        self.physical_condition = condition_note
        self.save()
        return f"Condition for '{self.library_item.title}' updated: {condition_note}"


    def __str__(self):
        return f"Printed Book: {self.library_item.title} (Copy {self.copy_number})"

    class Meta:
        db_table = "api_printedbookmodel"


class ResearchPaperModel(models.Model):
    """
    Research Paper model, for items that are primarily accessed via web scraping or APIs.
    """
    library_item = models.OneToOneField(
        LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='research_paper'
    )
    doi = models.CharField(max_length=100)
    citation_count = models.IntegerField(default=0)
    source_api = models.CharField(max_length=100)

    def get_citation_data(self):
        return f"Citations for '{self.library_item.title}': {self.citation_count}"

    def __str__(self):
        return f"Research Paper: {self.library_item.title}"


class AudiobookModel(models.Model):
    """
    Audiobook model includes fields for audio-specific details.
    """
    library_item = models.OneToOneField(
        LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='audiobook'
    )
    audio_format = models.CharField(max_length=20)
    duration = models.DurationField()
    narrator = models.CharField(max_length=100)

    def play_preview(self):
        return f"Playing preview of '{self.library_item.title}', narrated by {self.narrator}"

    def __str__(self):
        return f"Audiobook: {self.library_item.title}"
    
    class Meta:
        db_table = "api_audiobookmodel"  


class JournalModel(models.Model):
    """
    Journal model for academic periodicals.
    """
    library_item = models.OneToOneField(
        LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='journal'
    )
    volume = models.CharField(max_length=50)
    issue = models.CharField(max_length=50)
    issn = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Journal: {self.library_item.title} (Vol: {self.volume}, Issue: {self.issue})"
