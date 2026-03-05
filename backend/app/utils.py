"""
Shared utility functions for file validation and sanitization.
"""

import os
import re

# Magic bytes for supported file types
_MAGIC_BYTES = {
    ".pdf": (b"%PDF", 0),
    ".docx": (b"PK", 0),      # DOCX is a ZIP archive
    ".doc": (b"\xd0\xcf\x11\xe0", 0),  # OLE2 compound document
    ".mp3": (b"\xff\xfb", 0),  # MP3 frame sync (common)
    ".wav": (b"RIFF", 0),
    ".m4a": (b"\x00\x00\x00", 0),  # ftyp box (first 3 bytes vary, 4th+ has ftyp)
    ".mp4": (b"\x00\x00\x00", 0),  # ftyp box
}

# Secondary check for MP3 files (ID3 tag)
_MP3_ID3 = b"ID3"


def validate_file_magic(content: bytes, extension: str) -> bool:
    """Validate that file content matches the expected magic bytes for its extension.

    Returns True if the content appears legitimate, False otherwise.
    Unrecognised extensions are accepted (no magic-byte entry → pass).
    """
    ext = extension.lower()

    if ext not in _MAGIC_BYTES:
        return True  # No magic-byte rule → allow

    expected, offset = _MAGIC_BYTES[ext]

    if ext == ".mp3":
        # MP3 can start with ID3 tag or frame sync bytes
        return content[offset:offset + len(expected)] == expected or content[:3] == _MP3_ID3

    if ext in (".m4a", ".mp4"):
        # MPEG-4 containers: look for 'ftyp' within first 12 bytes
        return b"ftyp" in content[:12]

    return content[offset:offset + len(expected)] == expected


def sanitize_filename(name: str) -> str:
    """Strip path components and replace unsafe characters."""
    return re.sub(r'[^\w.\-]', '_', os.path.basename(name))
