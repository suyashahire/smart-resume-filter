"""
Run script for the HireQ backend.
"""

import os
import warnings

# Suppress HuggingFace tokenizer parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Suppress PyTorch deprecation warnings
warnings.filterwarnings("ignore", message="TypedStorage is deprecated")

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print("🚀 Starting HireQ Backend...")
    print(f"📍 Server running at http://{settings.HOST}:{settings.PORT}")
    print(f"📚 API Documentation at http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔧 Environment: {settings.ENVIRONMENT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )

