from datetime import timedelta
from django.utils import timezone

class Command:
    def execute(self):
        raise NotImplementedError

    def undo(self):
        raise NotImplementedError


class BorrowCommand(Command):
    def __init__(self, item, user):
        self.item = item
        self.user = user
        self.transaction = None

    def execute(self):
        self.transaction = self.item.process_borrow_return("borrow", self.user)

    def undo(self):
        if self.transaction and self.can_revoke():
            self.item.process_borrow_return("revoke", self.user)
        else:
            raise Exception("Cannot revoke: time limit exceeded or invalid transaction.")

    def can_revoke(self):
        return self.transaction and self.transaction.borrow_date >= timezone.now() - timedelta(hours=2)

class ReturnCommand(Command):
    def __init__(self, item, user):
        self.item = item
        self.user = user

    def execute(self):
        self.item.process_borrow_return("return", self.user)

    def undo(self):
        raise NotImplementedError("Undoing a return is not supported.")


class ReserveCommand(Command):
    def __init__(self, item, user):
        self.item = item
        self.user = user
        self.reservation = None

    def execute(self):
        from api.models.models_reservations import Reservation
        self.reservation = Reservation.add_to_reservation_queue(self.item, self.user)

    def undo(self):
        if self.reservation:
            from api.models.models_reservations import Reservation
            Reservation.cancel_reservation(self.item, self.user)
            print(f"Undo reserve: '{self.item.title}' reservation cancelled for {self.user.name}")
        else:
            raise Exception("No reservation to undo.")
