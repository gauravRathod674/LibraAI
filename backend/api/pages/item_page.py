# api/pages/item_page.py

from ninja import Router, Schema
from ninja.errors import HttpError
from typing import Optional
from api.factories.library_item_factory import LibraryItemFactory
from api.factories.user_roles import LibrarianUser  # Assuming you have this role class

router = Router(tags=["Library Items"])

class CreateItemSchema(Schema):
    item_type: str    # e.g., 'ebook', 'journal', 'physical', 'research', 'audio'
    title: str
    author: str
    genre: str
    availability: Optional[bool] = True

class CreateItemResponseSchema(Schema):
    success: bool
    message: str
    item_details: Optional[str] = None

@router.post("/add", response=CreateItemResponseSchema)
def add_item(request, data: CreateItemSchema):
    # Ensure only librarians can add items.
    # (Assumes request.auth is set via your JWT middleware and is an instance of your user role.)
    user = request.auth
    if not isinstance(user, LibrarianUser):
        raise HttpError(403, "Unauthorized. Only librarians can add items.")

    try:
        # Create the library item using the Factory Pattern.
        item = LibraryItemFactory.create_item(
            data.item_type, data.title, data.author, data.genre, data.availability
        )
        # Here you might later persist this item into your database (for physical books) or cache scraped data.
        return {
            "success": True,
            "message": "Library item added successfully.",
            "item_details": str(item)
        }
    except ValueError as e:
        raise HttpError(400, str(e))
