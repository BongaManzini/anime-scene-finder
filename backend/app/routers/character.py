from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection
from backend.app.models import CharacterCreate, CharacterOut, CharacterDetectionConfirm
from backend.app.services.character_service import create_character, add_reference_image, detect_character_in_scene

router = APIRouter(prefix="/api/characters", tags=["Characters"])

@router.get("", response_model=List[CharacterOut])
def list_characters(anime_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    sql = "SELECT * FROM characters"
    params = []
    if anime_id:
        sql += " WHERE anime_id = ?"
        params.append(anime_id)
    sql += " ORDER BY name ASC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    import json
    for r in rows:
        result.append({
            "id": r["id"],
            "anime_id": r["anime_id"],
            "name": r["name"],
            "description": r["description"],
            "ref_images": json.loads(r["ref_images"]) if r["ref_images"] else []
        })
    return result

@router.post("", response_model=CharacterOut)
def new_character(payload: CharacterCreate):
    try:
        return create_character(payload.name, payload.anime_id, payload.description)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/confirm-detection")
def confirm_detection(payload: CharacterDetectionConfirm):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE character_detections 
    SET confirmed_by_user = ? 
    WHERE scene_id = ? AND character_id = ?
    """, (payload.confirmed, payload.scene_id, payload.character_id))

    conn.commit()
    conn.close()
    return {"status": "success", "confirmed": payload.confirmed}
