from django.db import models
from .models_users import LibraryUser

class Download(models.Model):
    """
    Model to store information about downloaded resources by users.

    Tracks:
      - User who initiated the download
      - Name and size of the downloaded file
      - Timestamp of the download
    """

    user = models.ForeignKey(
        LibraryUser, 
        on_delete=models.CASCADE, 
        related_name="downloads"
    )
    file_name = models.CharField(max_length=255)
    file_size = models.CharField(max_length=20)  # e.g., "2.5 MB"
    downloaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} ({self.file_size}) by {self.user.name} on {self.downloaded_at.strftime('%Y-%m-%d %H:%M')}"
