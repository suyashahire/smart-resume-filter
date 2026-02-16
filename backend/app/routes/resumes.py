"""
Resume routes for uploading, parsing, and managing resumes.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime
import os
import aiofiles

from app.config import settings
from app.models.user import User
from app.models.resume import Resume, ResumeUploadResponse, ResumeListResponse, ParsedResumeData
from app.models.screening import ScreeningResult
from app.routes.auth import get_current_user
from app.services.resume_parser import get_resume_parser
from app.services.websocket_manager import get_connection_manager, EventType

router = APIRouter()

# Use singleton instance for model reuse (pre-loaded at startup)
resume_parser = get_resume_parser()


def validate_file_extension(filename: str) -> bool:
    """Validate if file has allowed extension."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in settings.allowed_resume_extensions_list


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and parse a resume file.
    
    - Supports PDF and DOCX formats
    - Maximum file size: 10MB
    - Automatically extracts: name, email, phone, skills, education, experience
    """
    # Validate file extension
    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_RESUME_EXTENSIONS}"
        )
    
    # Check file size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
        )
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, "resumes", safe_filename)
    
    # Save file locally
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_content)
    
    # Create resume document
    resume = Resume(
        user_id=str(current_user.id),
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file.content_type or "application/octet-stream"
    )
    
    try:
        # Parse resume
        parsed_data, raw_text = await resume_parser.parse_resume(file_path)
        
        resume.parsed_data = parsed_data
        resume.raw_text = raw_text
        resume.is_parsed = True
        
    except Exception as e:
        resume.is_parsed = False
        resume.parse_error = str(e)
    
    await resume.insert()
    
    # Broadcast real-time update
    ws_manager = get_connection_manager()
    await ws_manager.broadcast_event(
        EventType.RESUME_UPLOADED,
        {
            "id": str(resume.id),
            "file_name": resume.file_name,
            "is_parsed": resume.is_parsed,
            "candidate_name": resume.parsed_data.name if resume.parsed_data else None,
            "candidate_email": resume.parsed_data.email if resume.parsed_data else None,
            "skills_count": len(resume.parsed_data.skills) if resume.parsed_data else 0
        },
        user_id=str(current_user.id)
    )
    
    return ResumeUploadResponse(
        id=str(resume.id),
        file_name=resume.file_name,
        is_parsed=resume.is_parsed,
        parsed_data=resume.parsed_data,
        created_at=resume.created_at
    )


@router.post("/upload/batch", response_model=List[ResumeUploadResponse])
async def upload_multiple_resumes(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and parse multiple resume files at once.
    
    - Maximum 20 files per batch
    - Supports PDF and DOCX formats
    """
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 files per batch upload"
        )
    
    results = []
    
    for file in files:
        try:
            # Validate file extension
            if not validate_file_extension(file.filename):
                continue
            
            # Read file content
            file_content = await file.read()
            file_size = len(file_content)
            
            if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                continue
            
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
            safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(settings.UPLOAD_DIR, "resumes", safe_filename)
            
            # Save file locally
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(file_content)
            
            # Create resume document
            resume = Resume(
                user_id=str(current_user.id),
                file_name=file.filename,
                file_path=file_path,
                file_size=file_size,
                file_type=file.content_type or "application/octet-stream"
            )
            
            try:
                # Parse resume
                parsed_data, raw_text = await resume_parser.parse_resume(file_path)
                
                resume.parsed_data = parsed_data
                resume.raw_text = raw_text
                resume.is_parsed = True
                
            except Exception as e:
                resume.is_parsed = False
                resume.parse_error = str(e)
            
            await resume.insert()
            
            # Broadcast real-time update for each resume
            ws_manager = get_connection_manager()
            await ws_manager.broadcast_event(
                EventType.RESUME_UPLOADED,
                {
                    "id": str(resume.id),
                    "file_name": resume.file_name,
                    "is_parsed": resume.is_parsed,
                    "candidate_name": resume.parsed_data.name if resume.parsed_data else None,
                    "candidate_email": resume.parsed_data.email if resume.parsed_data else None,
                    "skills_count": len(resume.parsed_data.skills) if resume.parsed_data else 0,
                    "batch_upload": True
                },
                user_id=str(current_user.id)
            )
            
            results.append(ResumeUploadResponse(
                id=str(resume.id),
                file_name=resume.file_name,
                is_parsed=resume.is_parsed,
                parsed_data=resume.parsed_data,
                created_at=resume.created_at
            ))
            
        except Exception as e:
            print(f"Error processing file {file.filename}: {e}")
            continue
    
    return results


@router.get("/", response_model=List[ResumeListResponse])
async def list_resumes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    List all resumes uploaded by the current user.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    resumes = await Resume.find(
        Resume.user_id == str(current_user.id)
    ).skip(skip).limit(limit).sort(-Resume.created_at).to_list()
    
    return [
        ResumeListResponse(
            id=str(resume.id),
            file_name=resume.file_name,
            parsed_data=resume.parsed_data,
            is_parsed=resume.is_parsed,
            created_at=resume.created_at
        )
        for resume in resumes
    ]


@router.get("/{resume_id}", response_model=ResumeListResponse)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific resume by ID."""
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resume"
        )
    
    return ResumeListResponse(
        id=str(resume.id),
        file_name=resume.file_name,
        parsed_data=resume.parsed_data,
        is_parsed=resume.is_parsed,
        created_at=resume.created_at
    )


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Download the original resume file.
    
    Returns the PDF or DOCX file that was originally uploaded.
    """
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resume"
        )
    
    if not os.path.exists(resume.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on server"
        )
    
    # Determine media type based on file extension
    ext = os.path.splitext(resume.file_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    return FileResponse(
        path=resume.file_path,
        filename=resume.file_name,
        media_type=media_type
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a resume by ID."""
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this resume"
        )
    
    # Delete associated screening results
    await ScreeningResult.find(
        ScreeningResult.resume_id == resume_id,
        ScreeningResult.user_id == str(current_user.id)
    ).delete()
    
    # Delete file from storage
    if os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    
    await resume.delete()
    
    return None


@router.post("/{resume_id}/reparse", response_model=ResumeUploadResponse)
async def reparse_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user)
):
    """Re-parse an existing resume."""
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resume"
        )
    
    if not os.path.exists(resume.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on server"
        )
    
    try:
        # Re-parse resume
        parsed_data, raw_text = await resume_parser.parse_resume(resume.file_path)
        
        resume.parsed_data = parsed_data
        resume.raw_text = raw_text
        resume.is_parsed = True
        resume.parse_error = None
        resume.updated_at = datetime.utcnow()
        
    except Exception as e:
        resume.is_parsed = False
        resume.parse_error = str(e)
    
    await resume.save()
    
    return ResumeUploadResponse(
        id=str(resume.id),
        file_name=resume.file_name,
        is_parsed=resume.is_parsed,
        parsed_data=resume.parsed_data,
        created_at=resume.created_at
    )

