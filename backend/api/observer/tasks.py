from celery import shared_task
from datetime import datetime, timedelta
from django.utils import timezone
from api.models.models_transactions import BorrowingTransaction
from api.models.models_reservations import Reservation
from api.observer.user_observer import UserObserver
from api.observer.observer import Subject

@shared_task
def check_due_date_reminders():
    due_soon = datetime.now() + timedelta(days=2)

    transactions = BorrowingTransaction.objects.filter(
        due_date__lte=due_soon,
        returned_at__isnull=True
    )

    subject = Subject()
    user_observer = UserObserver()
    subject.attach(user_observer)

    for transaction in transactions:
        subject.notify(
            event_type='due_date_approaching',
            data={
                'user': transaction.user,
                'item': transaction.library_item,
                'due_date': transaction.due_date
            }
        )

@shared_task
def expire_old_reservations():
    now = timezone.now()
    expired_reservations = Reservation.objects.filter(
        status="Active",
        expiry_date__lt=now
    )

    subject = Subject()
    user_observer = UserObserver()
    subject.attach(user_observer)

    for reservation in expired_reservations:
        reservation.status = "Expired"
        reservation.save()

        subject.notify(
            event_type="reservation_expired",
            data={
                "user": reservation.user,
                "item": reservation.library_item
            }
        )
