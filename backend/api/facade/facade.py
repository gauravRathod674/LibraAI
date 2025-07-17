from api.commands.commands import BorrowCommand, ReturnCommand, ReserveCommand
from api.commands.invoker import Invoker
from api.models.models_items import LibraryItem
from api.models.models_users import LibraryUser
from api.models.models_reservations import Reservation

class LibraryServiceFacade:
    def __init__(self):
        self.invoker = Invoker()

    def borrow_item(self, item: LibraryItem, user: LibraryUser):
        if not user.can_borrow(item):
            raise Exception(f"{user.name} is not allowed to borrow this item.")
        if item.availability_status != "Available":
            raise Exception(f"'{item.title}' is not available for borrowing.")
        command = BorrowCommand(item, user)
        self.invoker.execute_command(user, command)

    def return_item(self, item: LibraryItem, user: LibraryUser):
        command = ReturnCommand(item, user)
        self.invoker.execute_command(user, command)

    def reserve_item(self, item: LibraryItem, user: LibraryUser):
        if item.availability_status == "Available":
            raise Exception(f"'{item.title}' is currently available. You can borrow it directly.")
        if Reservation.is_user_already_reserved(item, user):
            raise Exception(f"{user.name} has already reserved '{item.title}'.")
        command = ReserveCommand(item, user)
        self.invoker.execute_command(user, command)

    def undo_last_action(self, user: LibraryUser):
        self.invoker.undo_last(user)
