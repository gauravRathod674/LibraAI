from .item_types import EBook, Journal, PhysicalBook, ResearchPaper, AudioBook
from api.models.models_items import (
    LibraryItem,
    EBookModel,
    JournalModel,
    PrintedBookModel,
    ResearchPaperModel,
    AudiobookModel
)
from datetime import date

class LibraryItemFactory:
    # Mapping each item type directly to its corresponding class and model
    _item_map = {
        "ebook": (EBook, EBookModel),
        "journal": (Journal, JournalModel),
        "physical": (PhysicalBook, PrintedBookModel),
        "research": (ResearchPaper, ResearchPaperModel),
        "audio": (AudioBook, AudiobookModel)
    }

    @staticmethod
    def register_item_type(item_type, item_class, model_class):
        """
        Register a new item type with matching key for both class and model.
        Args:
            item_type (str): e.g., "magazine"
            item_class: class from item_types (e.g., Magazine)
            model_class: Django model (e.g., MagazineModel)
        """
        LibraryItemFactory._item_map[item_type.lower()] = (item_class, model_class)

    @staticmethod
    def create_item(item_type, title, author, genre, publication_date=None, **kwargs):
        """
        Create a LibraryItem and specialized model in one step.
        Returns tuple: (LibraryItem, SpecializedModel)
        """
        item_type = item_type.lower()

        if item_type not in LibraryItemFactory._item_map:
            raise ValueError(f"Unknown item type: {item_type}")

        item_class, model_class = LibraryItemFactory._item_map[item_type]

        # Create base LibraryItem
        library_item = LibraryItem.objects.create(
            title=title,
            authors=author,
            genre=genre,
            publication_date=publication_date or date.today(),
            item_type=item_type.capitalize()  # Store as 'Ebook', 'Journal', etc.
        )

        # Create specialized item using the corresponding model class
        specialized_item = model_class.objects.create(library_item=library_item, **kwargs)

        return library_item, specialized_item
