from django.db import models

class Analytics(models.Model):
    """
    Minimal analytics model for real-time reporting.
    
    Stores only aggregated information that can be updated periodically.
    """
    report_generated_at = models.DateTimeField(auto_now_add=True)
    most_borrowed_items = models.TextField(blank=True)    # Store as JSON or comma-separated values.
    peak_usage_hours = models.TextField(blank=True)
    genre_trends = models.TextField(blank=True)

    def __str__(self):
        return f"Analytics Report at {self.report_generated_at}"
