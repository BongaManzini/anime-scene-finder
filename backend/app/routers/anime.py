from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from backend.app.database import get_db_connection
from backend.app.models import AnimeCreate, AnimeOut

router = APIRouter(prefix="/api/anime", tags=["Anime"])

@router.get("", response_model=List[AnimeOut])
def list_anime():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM anime ORDER BY title ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("", response_model=AnimeOut)
def create_anime(anime: AnimeCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO anime (title, description) VALUES (?, ?)", (anime.title.strip(), anime.description))
        anime_id = cursor.lastrowid
        conn.commit()
        cursor.execute("SELECT * FROM anime WHERE id = ?", (anime_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Anime creation failed: {str(e)}")

@router.delete("/{anime_id}")
def delete_anime(anime_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM anime WHERE id = ?", (anime_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "deleted_id": anime_id}
