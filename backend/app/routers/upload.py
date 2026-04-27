import uuid
from typing import List

from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from supabase import create_client

from app.config import get_settings
from app.dependencies import get_current_user
from app.models.user import User

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/upload", tags=["upload"])

settings = get_settings()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

BUCKET = "record-images"
MAX_SIZE = 5 * 1024 * 1024  # 5MB

# 매직바이트로 실제 파일 타입 검증
MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": ("image/jpeg", "jpg"),
    b"\x89PNG\r\n\x1a\n": ("image/png", "png"),
    b"RIFF": ("image/webp", "webp"),  # RIFF....WEBP
    b"GIF87a": ("image/gif", "gif"),
    b"GIF89a": ("image/gif", "gif"),
}


def detect_image_type(data: bytes) -> tuple[str, str] | None:
    """매직바이트로 이미지 타입 감지. (mime, ext) 반환 또는 None"""
    for sig, info in MAGIC_SIGNATURES.items():
        if data[:len(sig)] == sig:
            return info
    return None


@router.post("")
@limiter.limit("30/hour")
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if len(files) > 4:
        raise HTTPException(status_code=400, detail="최대 4개까지 업로드 가능합니다")

    urls = []

    for file in files:
        content = await file.read()

        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다")

        detected = detect_image_type(content)
        if detected is None:
            raise HTTPException(
                status_code=400,
                detail="허용되지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF만 가능합니다.",
            )

        mime, ext = detected
        path = f"{current_user.id}/{uuid.uuid4()}.{ext}"

        supabase.storage.from_(BUCKET).upload(
            path,
            content,
            file_options={"content-type": mime},
        )

        public_url = supabase.storage.from_(BUCKET).get_public_url(path)
        urls.append(public_url)

    return {"urls": urls}
