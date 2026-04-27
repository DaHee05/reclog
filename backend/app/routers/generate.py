import uuid
import base64
from typing import Optional, List

from fastapi import APIRouter, Depends, Request, UploadFile, File, Form, HTTPException
from openai import OpenAI
from slowapi import Limiter
from slowapi.util import get_remote_address
from supabase import create_client

import logging

from app.config import get_settings
from app.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/generate", tags=["generate"])

settings = get_settings()
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

BUCKET = "record-images"

SYSTEM_PROMPT = """[ 역할 ]
전문 일러스트레이터가 폴라로이드 사진에 가볍게 낙서하듯, 업로드한 사진 위에 감성 손글씨 메모를 추가한다.

[ 분석 ]
사진 속 사물, 오브젝트, 배경의 종류 / 배치 / 분위기를 먼저 파악한다.
인물은 분석하되 메모 대상에서 제외한다.

[ 드로잉 규칙 ]
선 스타일 — 얇고 불규칙한 선. 전문 일러스트레이터가 가볍게 스케치한 느낌
색상 — 흰색 손글씨 및 드로잉만 사용
말투 — 친구에게 말하듯 다정하고 가벼운 한국어
유도선 — 화살표 또는 곡선 점선으로 시선을 특정 오브젝트로 자연스럽게 안내
아이콘 — 감성 아이콘을 과하지 않게 배치 (1~2개 이하)
손글씨 수 — 한 이미지에 최대 3개까지만
해시태그 — 사용자가 값을 직접 제공할 때만 추가. 그 외엔 생략

[ 제약 ]
사진에 없는 요소는 억지로 추가하지 않는다
결과물은 "원본 사진을 감성적으로 꾸민 버전"처럼 보여야 한다
사진 분위기와 어울리지 않는 아이콘·문구는 사용하지 않는다

[ 입력값 ]

사진 (필수)
해시태그 (선택 — 제공 시에만 추가)"""


@router.post("")
@limiter.limit("10/hour")
async def generate_overlay(
    request: Request,
    file: UploadFile = File(...),
    tags: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다")

    image_b64 = base64.b64encode(content).decode("utf-8")
    mime = file.content_type or "image/jpeg"

    user_prompt = "이 사진에 폴라로이드 감성 손글씨 메모를 그려주세요."
    if tags:
        user_prompt += f"\n해시태그: {tags}"

    try:
        response = openai_client.responses.create(
            model="gpt-4o",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": SYSTEM_PROMPT + "\n\n" + user_prompt},
                        {
                            "type": "input_image",
                            "image_url": f"data:{mime};base64,{image_b64}",
                        },
                    ],
                }
            ],
            tools=[{"type": "image_generation", "size": "1024x1024"}],
        )

        # 생성된 이미지 추출
        generated_image_b64 = None
        for block in response.output:
            if block.type == "image_generation_call":
                generated_image_b64 = block.result
                break

        if not generated_image_b64:
            raise HTTPException(status_code=500, detail="이미지 생성에 실패했습니다")

        # Supabase Storage에 업로드
        image_bytes = base64.b64decode(generated_image_b64)
        ext = "png"
        path = f"{current_user.id}/generated_{uuid.uuid4()}.{ext}"

        supabase.storage.from_(BUCKET).upload(
            path,
            image_bytes,
            file_options={"content-type": "image/png"},
        )

        public_url = supabase.storage.from_(BUCKET).get_public_url(path)

        return {"url": public_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OpenAI 이미지 생성 오류: {e}")
        raise HTTPException(status_code=500, detail="이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.")
