import uuid
import base64
import io
from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, Request, UploadFile, File, Form, HTTPException
from PIL import Image
from openai import OpenAI
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

import logging

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.ai_usage import AiUsage

DAILY_LIMIT = 5

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/generate", tags=["generate"])

settings = get_settings()
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

BUCKET = "record-images"

SYSTEM_PROMPT = """원본 이미지는 절대 수정하지 않고 유지한 채, 그 위에 흰색 손그림 오버레이만 추가한다.

[ 스타일 ]
얇고 자연스러운 손글씨 + 가볍게 스케치한 듯한 드로잉
화이트 단색만 사용 (그 외 색상 금지)
인스타 MZ 감성, 다이어리 꾸미기 느낌
한국어만 사용
글씨는 전체적으로 작고 섬세하게 — 이미지 크기 대비 5~8% 이하

[ 구성 ]
- 손글씨 문장: 딱 1개만 (짧고 감성적인 한 줄, 작은 크기로) — 사용자가 입력한 내용을 참고해 어울리는 문장으로
- 해시태그: 사용자가 제공한 경우에만, 아주 작게 흘려쓰듯
- 장식 메모: 화살표 + 짧은 단어 1~2개 (문장 아님)

[ 장식 ]
작은 하트, 별, 반짝이, 점선 화살표, 간단한 꽃 등 은은하게 작게 포인트로 추가

[ 배치 ]
피사체를 가리지 않게 자연스럽게 여백에 분산 배치
전체 오버레이 요소가 이미지 면적의 10% 이하

[ 필수 원칙 ]
- 원본 이미지를 수정하지 말 것 (회전 금지, 비율 유지)
- 텍스트 요소는 반드시 2개 이하
- 글씨는 작고 가늘게 — 굵거나 크게 쓰지 말 것
- 꾸미기 요소는 작고 귀엽게, 과하지 않게

[ 예시 문구 ]
'오늘도 좋은 하루 ✧'
'여기서의 시간 ♡'

[ 입력값 ]
사진 (필수)
내용 (선택 — 최대 20자, 문구 생성에 참고)
"""


@router.post("")
@limiter.limit("10/hour")
async def generate_overlay(
    request: Request,
    file: UploadFile = File(...),
    tags: Optional[str] = Form(None),
    user_content: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다")

    # 일일 사용량 원자적 증가 — ON CONFLICT로 동시 요청 시 레이스 방지
    today = date.today()
    upsert_stmt = (
        pg_insert(AiUsage)
        .values(id=uuid.uuid4(), user_id=current_user.id, date=today, count=1)
        .on_conflict_do_update(
            constraint="uq_ai_usage_user_date",
            set_={"count": AiUsage.count + 1},
            where=AiUsage.count < DAILY_LIMIT,
        )
        .returning(AiUsage.count)
    )
    result = await db.execute(upsert_stmt)
    row = result.fetchone()

    if row is None:
        # WHERE count < DAILY_LIMIT 조건 불충족 → 한도 초과
        raise HTTPException(status_code=403, detail="일일 사용 한도(5회)를 초과했습니다")

    new_count = row[0]
    await db.commit()

    user_prompt = "이 사진에 위 규칙에 따라 흰색 손그림 오버레이를 추가해줘."
    if user_content:
        user_prompt += f"\n내용: {user_content}"
    if tags:
        user_prompt += f"\n해시태그: {tags}"

    try:
        # JPEG 등 어떤 포맷이든 PNG로 변환해서 전달 (OpenAI API 호환성 보장)
        img = Image.open(io.BytesIO(content)).convert("RGBA")
        png_buf = io.BytesIO()
        img.save(png_buf, format="PNG")
        png_buf.seek(0)
        png_buf.name = "image.png"

        response = openai_client.images.edit(
            model="gpt-image-1",
            image=png_buf,
            prompt=SYSTEM_PROMPT + "\n\n" + user_prompt,
            size="auto",
            quality="high",
        )

        generated_image_b64 = response.data[0].b64_json

        if not generated_image_b64:
            logger.error("gpt-image-1 응답에 이미지 없음")
            raise HTTPException(status_code=500, detail="이미지 생성에 실패했습니다")

        # Supabase Storage에 업로드
        image_bytes = base64.b64decode(generated_image_b64)
        path = f"{current_user.id}/generated_{uuid.uuid4()}.png"

        supabase.storage.from_(BUCKET).upload(
            path,
            image_bytes,
            file_options={"content-type": "image/png"},
        )

        public_url = supabase.storage.from_(BUCKET).get_public_url(path)

        return {"url": public_url, "remaining": DAILY_LIMIT - new_count}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OpenAI 이미지 생성 오류: {e}")
        raise HTTPException(status_code=500, detail="이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.")
