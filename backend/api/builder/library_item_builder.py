from datetime import date
from api.factories.library_item_factory import LibraryItemFactory

class LibraryItemBuilder:
    def __init__(self):
        self._title = None
        self._author = None
        self._genre = None
        self._publication_date = None
        self._item_type = None
        self._format_available = []

    def set_title(self, title: str):
        self._title = title
        return self

    def set_author(self, author: str):
        self._author = author
        return self

    def set_genre(self, genre: str):
        self._genre = genre
        return self

    def set_publication_date(self, publication_date: date):
        self._publication_date = publication_date
        return self

    def set_item_type(self, item_type: str):
        self._item_type = item_type
        return self

    def add_format(self, format_type: str):
        if format_type not in self._format_available:
            self._format_available.append(format_type)
        return self

    def build(self):
        if not all([self._title, self._item_type, self._publication_date]):
            raise ValueError("Title, item type, and publication date must be set before building the item.")

        return LibraryItemFactory.create_item(
            title=self._title,
            author=self._author,  # Can be None
            genre=self._genre,  # Can be None
            publication_date=self._publication_date,
            item_type=self._item_type,
            format_available=self._format_available  # Can be empty list
        )

