from abc import ABC, abstractmethod

class LibraryItemState(ABC):
    @abstractmethod
    def borrow(self, item, user):
        pass

    @abstractmethod
    def reserve(self, item, user):
        pass

    @abstractmethod
    def return_item(self, item, user):
        pass

    @abstractmethod
    def get_status_name(self):
        pass

    def notify(self, message):
        print(f"NOTIFY: {message}")