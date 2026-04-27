import logging

from fastapi import APIRouter, Depends, Query
import httpx

from app.config import get_settings
from app.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/places", tags=["places"])

settings = get_settings()


@router.get("")
async def search_places(
    query: str = Query(..., min_length=1, max_length=100),
    current_user: User = Depends(get_current_user),
):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                params={"query": query, "size": 7},
                headers={"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"},
            )
            res.raise_for_status()
            data = res.json()

        return [
            {
                "place_name": doc["place_name"],
                "address_name": doc["address_name"],
                "road_address_name": doc.get("road_address_name", ""),
            }
            for doc in data.get("documents", [])
        ]
    except Exception as e:
        logger.error(f"카카오 장소 검색 오류: {e}")
        return []
