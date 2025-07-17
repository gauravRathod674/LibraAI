from functools import wraps
from api.models.models_users import LibraryUser
from api.models.models_reservations import Reservation
from api.utils.observer_utils import get_subject

subject = get_subject()

def with_due_date_reminder(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        from api.observer.tasks import check_due_date_reminders
        check_due_date_reminders.delay()
        return result
    return wrapper


def with_priority_borrowing(func):
    @wraps(func)
    def wrapper(item, user, *args, **kwargs):
        # Check if the item is reserved and the user is Faculty
        if item.state.get_status_name() == "Reserved" and user.role == "Faculty":
            # Get the next user in the reservation queue
            next_reservation = Reservation.get_next_user_in_queue(item)

            # If the user is not first in the queue, we need to move them
            if next_reservation and next_reservation.user != user:
                # Remove the user from the reservation queue if they're already there
                Reservation.cancel_reservation(item, user)
                
                # Reinsert the user at the front of the reservation queue
                # Create a new reservation with a shorter expiry date, as they're moved to the front
                Reservation.add_to_reservation_queue(item, user, duration_days=0)  # No duration to push them to the front

                # Notify the previous first in the queue about the change
                if next_reservation:
                    subject.notify("reservation_queue_updated", {
                        "user": next_reservation.user,
                        "item": item
                    })

        # Continue with the normal borrowing/reserving logic
        return func(item, user, *args, **kwargs)

    return wrapper
