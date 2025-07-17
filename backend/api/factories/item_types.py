class LibraryItemType:
    def __init__(self, title, author, genre, availability=True):
        """
        Base class representing a generic library item.
        
        Args:
            title (str): Title of the item.
            author (str): Author or responsible entity.
            genre (str): Genre or classification.
            availability (bool): Availability status.
        """
        self.title = title
        self.author = author
        self.genre = genre
        self.availability = availability

    def get_format(self):
        """
        Return a string representing the format of the item. 
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement this method.")

    def __str__(self):
        return f"{self.get_format()}: {self.title} by {self.author}"

class EBook(LibraryItemType):
    def get_format(self):
        return "E-Book"


class Journal(LibraryItemType):
    def get_format(self):
        return "Journal"


class PhysicalBook(LibraryItemType):
    def get_format(self):
        return "Physical Book"


class ResearchPaper(LibraryItemType):
    def get_format(self):
        return "Research Paper"


class AudioBook(LibraryItemType):
    def get_format(self):
        return "Audio Book"
