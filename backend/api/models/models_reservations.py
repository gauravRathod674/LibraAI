from django.db import models
from django.utils import timezone
from api.utils.observer_utils import get_subject
subject = get_subject()


RESERVATION_STATUS_CHOICES = [
    ("Active", "Active"),
    ("Expired", "Expired"),
    ("Cancelled", "Cancelled"),
]

class Reservation(models.Model):
    user = models.ForeignKey(
        'api.LibraryUser',
        on_delete=models.CASCADE,
        related_name="reservations"
    )
    library_item = models.ForeignKey(
        'api.LibraryItem',  
        on_delete=models.CASCADE,
        related_name="reservation_queue"
    )
    reservation_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=RESERVATION_STATUS_CHOICES, default="Active"
    )

    def __str__(self):
        return f"Reservation {self.id}: {self.user.name} reserved {self.library_item.title}"

    @classmethod
    def add_to_reservation_queue(cls, item, user, duration_days=7):
        existing = cls.objects.filter(user=user, library_item=item, status="Active").first()
        if existing:
            return existing

        expiry = timezone.now() + timezone.timedelta(days=duration_days)
        return cls.objects.create(user=user, library_item=item, expiry_date=expiry)

    @classmethod
    def cancel_reservation(cls, item, user):
        cls.objects.filter(
            library_item=item, user=user, status="Active"
        ).update(status="Cancelled")


    @classmethod
    def get_next_user_in_queue(cls, item):
        return (
            cls.objects.filter(library_item=item, status="Active")
            .exclude(expiry_date__lt=timezone.now())
            .order_by("reservation_date")
            .first()
        )

    @classmethod
    def notify_reserved_user(cls, item, returned=False):
        reserver = cls.get_next_user_in_queue(item)
        if reserver:
            event_type = "book_returned_notify_next" if returned else "reservation_available"
            subject.notify(event_type, {
                "user": reserver.user,       # always send as 'user'
                "item": item
            })

        
    @classmethod
    def expire_reservation(cls, reservation):
        if reservation.status == "Active":
            reservation.status = "Expired"
            reservation.save()
            subject.notify("reservation_expired", {
                "user": reservation.user,
                "item": reservation.library_item
            })  

    @staticmethod
    def is_user_already_reserved(item, user):
        return Reservation.objects.filter(library_item=item, user=user, status="Active").exists()


