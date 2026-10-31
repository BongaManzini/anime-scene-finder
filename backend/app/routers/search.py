from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from backend.app.services.search_service import search_scenes

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("", response_model=List[Dict[str, Any]])
def search_endpoint(
    q: Optional[str] = Query(None, description="Natural language search query"),
    anime: Optional[str] = Query(None, description="Filter by Anime Title"),
    character: Optional[str] = Query(None, description="Filter by Character Name"),
    mood: Optional[str] = Query(None, description="Filter by Mood tag"),
    action: Optional[str] = Query(None, description="Filter by Action tag"),
    tag: Optional[str] = Query(None, description="General Tag filter"),
    min_confidence: float = Query(0.0, description="Minimum character detection confidence"),
    episode_id: Optional[int] = Query(None, description="Filter by specific Episode ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    return search_scenes(
        query=q,
        anime_title=anime,
        character_name=character,
        mood=mood,
        action=action,
        tag=tag,
        min_confidence=min_confidence,
        episode_id=episode_id,
        limit=limit,
        offset=offset
    )
