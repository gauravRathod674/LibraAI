from api.models.models_transactions import BorrowingTransaction
from datetime import datetime, timedelta

from api.utils.observer_utils import get_subject

subject = get_subject()


def send_due_date_reminders():
    today = datetime.today().date()
    reminder_day = today + timedelta(days=2)

    transactions = BorrowingTransaction.objects.filter(
        due_date=reminder_day,
        status=BorrowingTransaction.STATUS_ACTIVE, 
    )

    for tx in transactions:
        subject.notify(
            "due_date_approaching",
            {"user": tx.user, "item": tx.item, "due_date": tx.due_date},
        )
