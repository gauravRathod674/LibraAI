from .state_interface import LibraryItemState
from api.decorators.decorators import with_priority_borrowing

class AvailableState(LibraryItemState):
    def borrow(self, item, user):
        if not user.can_borrow(item):
            raise PermissionError("User not permitted to borrow this item.")

        item.change_state(CheckedOutState())
        item.process_borrow_return("borrow", user)
        self.notify(f"{item.title} was borrowed by {user.name}")

    def reserve(self, item, user):
        if not user.can_reserve(item):
            raise PermissionError("User not permitted to reserve this item.")

        item.add_to_reservation_queue(user)
        item.change_state(ReservedState())
        self.notify(f"{user.name} reserved {item.title}")

    def return_item(self, item, user):
        raise Exception("Item is already available.")
    
    def get_status_name(self):
        return "Available" 

class CheckedOutState(LibraryItemState):
    def borrow(self, item, user):
        raise Exception("This item is already checked out.")

    def reserve(self, item, user):
        if not user.can_reserve(item):
            raise PermissionError("User not permitted to reserve this item.")

        item.add_to_reservation_queue(user)
        self.notify(f"{user.name} added to the reservation queue for {item.title}")

    def return_item(self, item, user):
        item.process_borrow_return("return", user)

        if item.is_damaged():
            item.change_state(item.get_under_review_state())
            self.notify(f"{item.title} returned and marked for review.")
            return

        if item.has_reservations():
            item.change_state(ReservedState())
            item.notify_next_in_queue()
        else:
            item.change_state(AvailableState())

        self.notify(f"{item.title} was returned by {user.name}")

    def get_status_name(self):
        return "CheckedOut" 

class ReservedState(LibraryItemState):
    @with_priority_borrowing
    def borrow(self, item, user):
        if not item.is_first_in_queue(user):
            raise Exception("This item is reserved by another user.")

        if not user.can_borrow(item):
            raise PermissionError("User not permitted to borrow this item.")

        item.cancel_reservation(user)
        item.change_state(CheckedOutState())
        item.process_borrow_return("borrow", user)
        self.notify(f"{item.title} was borrowed by {user.name}")

    def reserve(self, item, user):
        if not user.can_reserve(item):
            raise PermissionError("User not permitted to reserve this item.")

        item.add_to_reservation_queue(user)
        self.notify(f"{user.name} added to the waitlist for {item.title}")

    def return_item(self, item, user):
        item.process_borrow_return("return", user)

        if item.is_damaged():
            item.change_state(item.get_under_review_state())
            self.notify(f"{item.title} returned and marked for review.")
            return

        item.notify_next_in_queue()
        self.notify(f"{item.title} returned and held for next reservation.")

    def get_status_name(self):
        return "Reserved" 

class UnderReviewState(LibraryItemState):
    def borrow(self, item, user):
        raise Exception("This item is under review and cannot be borrowed.")

    def reserve(self, item, user):
        if not user.can_reserve(item):
            raise PermissionError("User not permitted to reserve this item.")

        item.add_to_reservation_queue(user)
        self.notify(f"{user.name} reserved {item.title} (pending review)")

    def return_item(self, item, user):
        raise Exception("Cannot return an item that is already under review.")

    def review_complete(self, item, issue_resolved=True):
        if issue_resolved:
            new_state = ReservedState() if item.has_reservations() else AvailableState()
            item.change_state(new_state)
            self.notify(f"{item.title} is now available after review.")
        else:
            self.notify(f"{item.title} remains under review due to unresolved issues.")

    def get_status_name(self):
        return "UnderReview" 