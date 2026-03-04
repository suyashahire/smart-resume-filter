"""
Shared dependencies for route handlers.
"""

from fastapi import HTTPException, status


def validate_object_id(id_value: str) -> str:
    """
    Validate that a string is a valid MongoDB ObjectId format.
    Raises HTTP 400 if invalid.
    """
    if not id_value or len(id_value) != 24:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: '{id_value}'"
        )
    try:
        int(id_value, 16)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: '{id_value}'"
        )
    return id_value
