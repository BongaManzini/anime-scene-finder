from fastapi import APIRouter, HTTPException
from backend.app.models import SubtitleImport
from backend.app.services.subtitle_service import import_episode_subtitles

router = APIRouter(prefix="/api/subtitles", tags=["Subtitles"])

@router.post("/import")
def import_subtitles(payload: SubtitleImport):
    try:
        count = import_episode_subtitles(payload.episode_id, payload.filepath)
        return {"status": "success", "imported_count": count, "episode_id": payload.episode_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Subtitle import failed: {str(e)}")
