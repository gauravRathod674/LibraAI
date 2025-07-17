class UserRole:
    def __init__(self, name, email, password):
        self.name = name
        self.email = email
        self.password = password

    def get_borrow_limit(self):
        raise NotImplementedError

    def get_borrow_duration(self):
        raise NotImplementedError


class StudentUser(UserRole):
    def get_borrow_limit(self):
        return 3

    def get_borrow_duration(self):
        return 14  # days


class FacultyUser(UserRole):
    def get_borrow_limit(self):
        return 10

    def get_borrow_duration(self):
        return 30


class ResearcherUser(UserRole):
    def get_borrow_limit(self):
        return 5

    def get_borrow_duration(self):
        return 21


class GuestUser(UserRole):
    def get_borrow_limit(self):
        return 0  # Cannot borrow

    def get_borrow_duration(self):
        return 0


class LibrarianUser(UserRole):
    def get_borrow_limit(self):
        return float("inf")

    def get_borrow_duration(self):
        return 60
