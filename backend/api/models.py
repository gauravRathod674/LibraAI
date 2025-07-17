# from django.db import models
# from django.utils import timezone
# from datetime import timedelta

# # -------------------------------------------------------------------
# # Choices for various status and types.
# # -------------------------------------------------------------------
# AVAILABILITY_STATUS_CHOICES = [
#     ('Available', 'Available'),
#     ('CheckedOut', 'Checked Out'),
#     ('Reserved', 'Reserved'),
#     ('UnderReview', 'Under Review'),
# ]

# LIBRARY_ITEM_TYPE_CHOICES = [
#     ('EBook', 'E-Book'),
#     ('PrintedBook', 'Printed Book'),
#     ('ResearchPaper', 'Research Paper'),
#     ('Audiobook', 'Audiobook'),
# ]

# USER_ROLE_CHOICES = [
#     ('Student', 'Student'),
#     ('Researcher', 'Researcher'),
#     ('Faculty', 'Faculty'),
#     ('Guest', 'Guest'),
# ]

# TRANSACTION_STATUS_CHOICES = [
#     ('Active', 'Active'),
#     ('Completed', 'Completed'),
#     ('Overdue', 'Overdue'),
# ]

# RESERVATION_STATUS_CHOICES = [
#     ('Active', 'Active'),
#     ('Expired', 'Expired'),
#     ('Cancelled', 'Cancelled'),
# ]

# SEARCH_TYPE_CHOICES = [
#     ('Keyword', 'Keyword-Based'),
#     ('Genre', 'Genre-Based'),
#     ('Author', 'Author-Based'),
# ]

# # -------------------------------------------------------------------
# # Core Domain Models (Encapsulation, Inheritance, Abstraction)
# # -------------------------------------------------------------------
# class LibraryItem(models.Model):
#     """
#     Base model for all library items.
#     Implements common properties for all items such as title, authors, and status.
#     This is the foundation for inheritance. Specific types (EBook, PrintedBook, etc.)
#     extend from this model.
#     """
#     title = models.CharField(max_length=255)
#     authors = models.CharField(max_length=255)  # For more robust models, consider ManyToManyField.
#     publication_date = models.DateField()
#     genre = models.CharField(max_length=100)
#     availability_status = models.CharField(
#         max_length=20, choices=AVAILABILITY_STATUS_CHOICES, default='Available'
#     )
#     digital_source = models.URLField(blank=True, null=True)
#     item_type = models.CharField(
#         max_length=20, choices=LIBRARY_ITEM_TYPE_CHOICES, default='PrintedBook'
#     )

#     def get_details(self):
#         """Returns a summary string of the item metadata."""
#         return f"{self.title} by {self.authors} (Published: {self.publication_date}) - {self.availability_status}"

#     def update_availability(self, status):
#         """Update the availability status of the item."""
#         self.availability_status = status
#         self.save()

#     # Virtual methods for OOP polymorphism.
#     def borrow_item(self, user):
#         raise NotImplementedError("borrow_item() must be implemented by subclass.")

#     def return_item(self, user):
#         raise NotImplementedError("return_item() must be implemented by subclass.")

#     def reserve_item(self, user):
#         raise NotImplementedError("reserve_item() must be implemented by subclass.")

#     def __str__(self):
#         return f"{self.title} ({self.item_type})"

# # -------------------------------------------------------------------
# # Specialized Library Item Models (Inheritance & Builder Pattern potential)
# # -------------------------------------------------------------------
# class EBook(models.Model):
#     """
#     E-Book model uses one-to-one relationship to extend LibraryItem.
#     Additional attributes include file format and download link.
#     """
#     library_item = models.OneToOneField(
#         LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='ebook'
#     )
#     file_format = models.CharField(max_length=20)
#     download_link = models.URLField()

#     def open_book(self):
#         # Placeholder: In actual implementation, incorporate file-read logic.
#         return f"Opening '{self.library_item.title}' as a {self.file_format} file."

#     def __str__(self):
#         return f"E-Book: {self.library_item.title}"

# class PrintedBook(models.Model):
#     """
#     Printed Book model to handle physical copies.
#     Includes location within the library and copy identifier.
#     """
#     library_item = models.OneToOneField(
#         LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='printed_book'
#     )
#     location = models.CharField(max_length=100)  # Shelf or section.
#     copy_number = models.IntegerField()

#     def mark_physical_condition(self, condition_note):
#         # In a more robust system, add a field for condition notes.
#         return f"Condition for '{self.library_item.title}' updated: {condition_note}"

#     def __str__(self):
#         return f"Printed Book: {self.library_item.title} (Copy {self.copy_number})"

# class ResearchPaper(models.Model):
#     """
#     Research Paper model, linking to external academic data (e.g., from Semantic Scholar).
#     Incorporates digital object identifiers (DOI) and citation count.
#     """
#     library_item = models.OneToOneField(
#         LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='research_paper'
#     )
#     doi = models.CharField(max_length=100)
#     citation_count = models.IntegerField(default=0)
#     source_api = models.CharField(max_length=100)  # E.g. 'Semantic Scholar'

#     def get_citation_data(self):
#         # Potentially integrate with an external API call here.
#         return f"Citations for '{self.library_item.title}': {self.citation_count}"

#     def __str__(self):
#         return f"Research Paper: {self.library_item.title}"

# class Audiobook(models.Model):
#     """
#     Audiobook model includes attributes for audio-specific details.
#     """
#     library_item = models.OneToOneField(
#         LibraryItem, on_delete=models.CASCADE, primary_key=True, related_name='audiobook'
#     )
#     audio_format = models.CharField(max_length=20)
#     duration = models.DurationField()
#     narrator = models.CharField(max_length=100)

#     def play_preview(self):
#         # Placeholder for audio preview playback.
#         return f"Playing preview of '{self.library_item.title}', narrated by {self.narrator}"

#     def __str__(self):
#         return f"Audiobook: {self.library_item.title}"

# # -------------------------------------------------------------------
# # User Models (Polymorphism for Borrowing Policies & Role-Based Access)
# # -------------------------------------------------------------------
# class LibraryUser(models.Model):
#     """
#     Base user model for system users.
#     This model includes secure authentication details and current loan tracking.
#     """
#     name = models.CharField(max_length=255)
#     email = models.EmailField(unique=True)
#     password_hash = models.CharField(max_length=255)  # Replace with Django's auth in production.
#     role = models.CharField(max_length=20, choices=USER_ROLE_CHOICES)
#     # List of items currently borrowed.
#     current_loans = models.ManyToManyField(LibraryItem, blank=True, related_name="borrowers")

#     def __str__(self):
#         return f"{self.name} ({self.role})"

# # Specialized user models implementing polymorphic borrow policies.
# class StudentUser(LibraryUser):
#     def borrow_item(self, item: LibraryItem):
#         # Student-specific borrowing logic (e.g., limited loan period)
#         return f"Student {self.name} borrowing '{item.title}'. Due in 14 days."

# class ResearcherUser(LibraryUser):
#     def borrow_item(self, item: LibraryItem):
#         # Extended borrowing period for researchers, especially research papers.
#         return f"Researcher {self.name} borrowing '{item.title}'. Due in 30 days."

# class FacultyUser(LibraryUser):
#     def borrow_item(self, item: LibraryItem):
#         # Faculty might have priority or longer durations.
#         return f"Faculty {self.name} borrowing '{item.title}' with priority handling."

# class GuestUser(LibraryUser):
#     def view_catalog(self):
#         # Guests have read-only privileges.
#         return "Guest access: Viewing catalog with no borrowing privileges."

# # -------------------------------------------------------------------
# # Transaction & Reservation Models (Encapsulating Lending Policies & Late Fee Management)
# # -------------------------------------------------------------------
# class BorrowingTransaction(models.Model):
#     """
#     Record every borrowing event in the library.
#     Implements aspects of state and command patterns (e.g., reversible actions).
#     """
#     user = models.ForeignKey(LibraryUser, on_delete=models.CASCADE, related_name="transactions")
#     library_item = models.ForeignKey(LibraryItem, on_delete=models.CASCADE, related_name="transactions")
#     borrow_date = models.DateTimeField(auto_now_add=True)
#     due_date = models.DateTimeField()
#     return_date = models.DateTimeField(blank=True, null=True)
#     status = models.CharField(max_length=20, choices=TRANSACTION_STATUS_CHOICES, default='Active')

#     def complete_transaction(self):
#         """
#         Completes the transaction and updates the item availability.
#         Implements a Command Pattern for undoable actions.
#         """
#         self.status = 'Completed'
#         self.return_date = timezone.now()
#         self.save()
#         self.library_item.update_availability('Available')

#     def calculate_late_fee(self):
#         """
#         Calculate dynamic late fees based on user role and delay.
#         Future improvement: Vary rates by user role and book demand.
#         """
#         if self.return_date and self.return_date > self.due_date:
#             delay = self.return_date - self.due_date
#             # Example: Fine per hour overdue.
#             fine = delay.total_seconds() / 3600  
#             return fine
#         return 0

#     def __str__(self):
#         return f"Transaction {self.id}: {self.user.name} borrowed '{self.library_item.title}'"

# class Reservation(models.Model):
#     """
#     Manage reservation records when an item is not immediately available.
#     Incorporates expiration and cancellation.
#     """
#     user = models.ForeignKey(LibraryUser, on_delete=models.CASCADE, related_name="reservations")
#     library_item = models.ForeignKey(LibraryItem, on_delete=models.CASCADE, related_name="reservations")
#     reservation_date = models.DateTimeField(auto_now_add=True)
#     expiry_date = models.DateTimeField()
#     status = models.CharField(max_length=20, choices=RESERVATION_STATUS_CHOICES, default='Active')

#     def activate_reservation(self):
#         """
#         Activate a reservation when an item becomes available.
#         This method might trigger the Observer Pattern for notifications.
#         """
#         self.status = 'Expired'  # Or transition to a new BorrowingTransaction.
#         self.save()

#     def cancel_reservation(self):
#         self.status = 'Cancelled'
#         self.save()

#     def __str__(self):
#         return f"Reservation {self.id}: {self.user.name} reserved '{self.library_item.title}'"

# # -------------------------------------------------------------------
# # Behavioral & Auxiliary Models
# # -------------------------------------------------------------------
# class Notification(models.Model):
#     """
#     Model to hold notifications for users.
#     Implements the Observer Pattern to notify on key events (e.g., item availability, due dates).
#     """
#     user = models.ForeignKey(LibraryUser, on_delete=models.CASCADE, related_name="notifications")
#     message = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)
#     is_read = models.BooleanField(default=False)

#     def send_notification(self):
#         # In production, integrate with email/SMS systems.
#         return f"Notification sent to {self.user.name}: {self.message}"

#     def mark_as_read(self):
#         self.is_read = True
#         self.save()

#     def __str__(self):
#         return f"Notification for {self.user.name} at {self.timestamp}"

# class SearchQuery(models.Model):
#     """
#     Encapsulates a search query.
#     Designed for the Strategy Pattern where different algorithms (keyword, genre, author) can be applied.
#     """
#     query_string = models.CharField(max_length=255)
#     search_type = models.CharField(max_length=20, choices=SEARCH_TYPE_CHOICES, default='Keyword')
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def execute_search(self):
#         """
#         Placeholder method: Implement different search algorithms based on search_type.
#         Returns a SearchResult instance.
#         """
#         # You would hook in Strategy implementations here.
#         return SearchResult.objects.create(results="[]", total_results=0)

#     def __str__(self):
#         return f"Search Query: {self.query_string} ({self.search_type})"

# class SearchResult(models.Model):
#     """
#     Holds the results of a search query.
#     """
#     results = models.TextField()  # In production, use JSON or a proper relationship.
#     total_results = models.IntegerField(default=0)
#     generated_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Search Results at {self.generated_at}: {self.total_results} results"

# class Analytics(models.Model):
#     """
#     Analytics to capture real-time usage metrics.
#     Implements real-time tracking for most borrowed books, peak hours, and genre trends.
#     """
#     report_generated_at = models.DateTimeField(auto_now_add=True)
#     most_borrowed_books = models.TextField()  # Store as JSON or stringified data.
#     peak_usage_hours = models.TextField()
#     genre_trends = models.TextField()

#     def generate_report(self):
#         # Hook in your analytics logic here.
#         return {
#             "most_borrowed": self.most_borrowed_books,
#             "peak_hours": self.peak_usage_hours,
#             "genre_trends": self.genre_trends
#         }

#     def __str__(self):
#         return f"Analytics Report at {self.report_generated_at}"

# # -------------------------------------------------------------------
# # External API Adapter (Adapter Pattern)
# # -------------------------------------------------------------------
# class ExternalAPIAdapter(models.Model):
#     """
#     Interface model for integrating external data sources such as Open Library,
#     Semantic Scholar, or the Internet Archive.
#     """
#     api_source = models.CharField(max_length=50)  # e.g., 'OpenLibrary', 'SemanticScholar'
#     api_credentials = models.CharField(max_length=255)  # Store securely (encrypted in production)

#     def fetch_item_details(self, external_id):
#         """
#         Fetch and parse external item details and return in LibraryItem format.
#         Intended for use with the Builder Pattern to construct complex objects.
#         """
#         # Placeholder: integration code with external APIs.
#         return {
#             "title": "External Item Title",
#             "authors": "Author Name",
#             "publication_date": timezone.now().date(),
#             "genre": "Fiction",
#             "digital_source": f"http://{self.api_source}.org/item/{external_id}"
#         }

#     def __str__(self):
#         return f"External API Adapter for {self.api_source}"

# # -------------------------------------------------------------------
# # Singleton / Facade Helper Model (Pseudo-singleton in context of Django)
# # -------------------------------------------------------------------
# class LibraryDatabase:
#     """
#     This is a helper class to emulate the Singleton Pattern.
#     Although Django's ORM already provides a global database connection,
#     this class centralizes library-wide operations.
#     """
#     _instance = None

#     @staticmethod
#     def get_instance():
#         if LibraryDatabase._instance is None:
#             LibraryDatabase._instance = LibraryDatabase()
#         return LibraryDatabase._instance

#     def add_item(self, item: LibraryItem):
#         item.save()
#         # Additional logic for indexing, logging, etc.

#     def process_borrow_return(self, transaction: BorrowingTransaction):
#         transaction.save()
#         # Additional logging for audit purposes.

#     def __init__(self):
#         # Private constructor to enforce singleton.
#         if LibraryDatabase._instance is not None:
#             raise Exception("This class is a singleton!")
#         else:
#             LibraryDatabase._instance = self

# # -------------------------------------------------------------------
# # End of models.py
# # -------------------------------------------------------------------
