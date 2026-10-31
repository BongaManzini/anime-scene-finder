from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection
from backend.app.models import SceneOut, SceneTagUpdate

router = APIRouter(prefix="/api/scenes", tags=["Scenes"])

@router.get("/{scene_id}", response_model=SceneOut)
def get_scene(scene_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.*, e.filename, e.season_num, e.episode_num, a.title as anime_title
    FROM scenes s
    JOIN episodes e ON s.episode_id = e.id
    JOIN anime a ON e.anime_id = a.id
    WHERE s.id = ?
    """, (scene_id,))
    r = cursor.fetchone()

    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Scene not found")

    # Fetch characters
    cursor.execute("""
    SELECT c.name, cd.confidence 
    FROM character_detections cd JOIN characters c ON cd.character_id = c.id
    WHERE cd.scene_id = ?
    """, (scene_id,))
    chars = [f"{c['name']} ({int(c['confidence']*100)}%)" for c in cursor.fetchall()]

    # Fetch subtitles
    cursor.execute("SELECT text FROM subtitles WHERE scene_id = ?", (scene_id,))
    subs = [sub["text"] for sub in cursor.fetchall()]

    conn.close()

    return {
        "id": r["id"],
        "episode_id": r["episode_id"],
        "anime_title": r["anime_title"],
        "filename": r["filename"],
        "season_num": r["season_num"],
        "episode_num": r["episode_num"],
        "scene_number": r["scene_number"],
        "start_time_sec": r["start_time_sec"],
        "end_time_sec": r["end_time_sec"],
        "start_timestamp": r["start_timestamp"],
        "end_timestamp": r["end_timestamp"],
        "thumbnail_path": r["thumbnail_path"],
        "description": r["description"] or "",
        "mood_tags": r["mood_tags"] or "",
        "action_tags": r["action_tags"] or "",
        "user_tags": r["user_tags"] or "",
        "is_favorite": bool(r["is_favorite"]),
        "characters": chars,
        "subtitles": subs
    }

@router.patch("/{scene_id}", response_model=SceneOut)
def update_scene_tags(scene_id: int, payload: SceneTagUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = []
    params = []

    if payload.mood_tags is not None:
        updates.append("mood_tags = ?")
        params.append(payload.mood_tags)
    if payload.action_tags is not None:
        updates.append("action_tags = ?")
        params.append(payload.action_tags)
    if payload.user_tags is not None:
        updates.append("user_tags = ?")
        params.append(payload.user_tags)
    if payload.description is not None:
        updates.append("description = ?")
        params.append(payload.description)
    if payload.is_favorite is not None:
        updates.append("is_favorite = ?")
        params.append(1 if payload.is_favorite else 0)

    if updates:
        sql = f"UPDATE scenes SET {', '.join(updates)} WHERE id = ?"
        params.append(scene_id)
        cursor.execute(sql, params)

        # Update FTS5 entry
        cursor.execute("SELECT * FROM scenes WHERE id = ?", (scene_id,))
        sc = cursor.fetchone()
        if sc:
            cursor.execute("""
            UPDATE scenes_fts 
            SET description = ?, mood_tags = ?, action_tags = ?, user_tags = ?
            WHERE scene_id = ?
            """, (sc["description"] or "", sc["mood_tags"] or "", sc["action_tags"] or "", sc["user_tags"] or "", scene_id))

        conn.commit()

    conn.close()
    return get_scene(scene_id)
