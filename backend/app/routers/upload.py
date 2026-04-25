import uuid
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from supabase import create_client

from app.config import get_settings

router = APIRouter(prefix="/api/upload", tags=["upload"])

settings = get_settings()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

BUCKET = "record-images"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def upload_images(files: List[UploadFile] = File(...)):
    urls = []

    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"허용되지 않는 파일 형식: {file.content_type}",
            )

        content = await file.read()

        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다")

        ext = file.filename.rsplit(".", 1)[-1] if file.filename else "jpg"
        path = f"{uuid.uuid4()}.{ext}"

        supabase.storage.from_(BUCKET).upload(
            path,
            content,
            file_options={"content-type": file.content_type},
        )

        public_url = supabase.storage.from_(BUCKET).get_public_url(path)
        urls.append(public_url)

    return {"urls": urls}
