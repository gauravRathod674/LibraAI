from django.db import models
from .models_users import LibraryUser

class Notification(models.Model):
    """
    Minimal notification model implementing the Observer Pattern.
    
    Alerts users about critical events such as:
      - Availability updates on reserved items.
      - Upcoming due dates.
      - Other real-time status changes.
    
    Stores a short message, timestamp, and read status.
    """
    user = models.ForeignKey(LibraryUser, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.name} at {self.created_at}"
    
    def mark_as_read(self):
      self.is_read = True
      self.save()

