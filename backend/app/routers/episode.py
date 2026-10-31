import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection
from backend.app.models import EpisodeImport, EpisodeOut, EpisodeUpdate, AnalysisRequest
from backend.app.services.video_service import extract_video_metadata, parse_filename_metadata
from backend.app.services.scene_service import analyze_episode_scenes

router = APIRouter(prefix="/api/episodes", tags=["Episodes"])

@router.get("", response_model=List[EpisodeOut])
def list_episodes(anime_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """
    SELECT 
        e.*, 
        a.title as anime_title,
        (SELECT COUNT(*) FROM scenes s WHERE s.episode_id = e.id) as scene_count
    FROM episodes e
    JOIN anime a ON e.anime_id = a.id
    """
    params = []
    if anime_id:
        sql += " WHERE e.anime_id = ?"
        params.append(anime_id)

    sql += " ORDER BY a.title ASC, e.season_num ASC, e.episode_num ASC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/import", response_model=List[EpisodeOut])
def import_episodes(payload: EpisodeImport):
    conn = get_db_connection()
    cursor = conn.cursor()

    imported = []
    for path in payload.filepaths:
        if not os.path.exists(path):
            continue

        try:
            meta = extract_video_metadata(path)
            auto_title, season, ep_num = parse_filename_metadata(meta["filename"])

            target_anime_title = payload.anime_title if payload.anime_title else auto_title
            target_season = payload.season_num if payload.season_num else season

            # Check or create anime entry
            cursor.execute("SELECT id FROM anime WHERE title = ?", (target_anime_title,))
            anime_row = cursor.fetchone()
            if anime_row:
                a_id = anime_row["id"]
            else:
                cursor.execute("INSERT INTO anime (title) VALUES (?)", (target_anime_title,))
                a_id = cursor.lastrowid

            cursor.execute("""
            INSERT INTO episodes (
                anime_id, filepath, filename, season_num, episode_num, duration, resolution, fps, size_bytes, format, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unprocessed')
            ON CONFLICT(filepath) DO UPDATE SET
                duration = excluded.duration,
                resolution = excluded.resolution,
                fps = excluded.fps
            """, (a_id, meta["filepath"], meta["filename"], target_season, ep_num, meta["duration"], meta["resolution"], meta["fps"], meta["size_bytes"], meta["format"]))

            ep_id = cursor.lastrowid if cursor.lastrowid else cursor.execute("SELECT id FROM episodes WHERE filepath = ?", (meta["filepath"],)).fetchone()["id"]
            conn.commit()

            cursor.execute("""
            SELECT e.*, a.title as anime_title, 
            (SELECT COUNT(*) FROM scenes s WHERE s.episode_id = e.id) as scene_count
            FROM episodes e JOIN anime a ON e.anime_id = a.id WHERE e.id = ?
            """, (ep_id,))
            imported.append(dict(cursor.fetchone()))
        except Exception as e:
            print(f"Import error for {path}: {str(e)}")

    conn.close()
    return imported

@router.patch("/{episode_id}", response_model=EpisodeOut)
def update_episode_metadata(episode_id: int, payload: EpisodeUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    if payload.anime_id is not None:
        cursor.execute("UPDATE episodes SET anime_id = ? WHERE id = ?", (payload.anime_id, episode_id))
    if payload.season_num is not None:
        cursor.execute("UPDATE episodes SET season_num = ? WHERE id = ?", (payload.season_num, episode_id))
    if payload.episode_num is not None:
        cursor.execute("UPDATE episodes SET episode_num = ? WHERE id = ?", (payload.episode_num, episode_id))

    conn.commit()

    cursor.execute("""
    SELECT e.*, a.title as anime_title, 
    (SELECT COUNT(*) FROM scenes s WHERE s.episode_id = e.id) as scene_count
    FROM episodes e JOIN anime a ON e.anime_id = a.id WHERE e.id = ?
    """, (episode_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Episode not found")
    return dict(row)

@router.post("/analyze")
def trigger_analysis(payload: AnalysisRequest, background_tasks: BackgroundTasks):
    """Triggers PySceneDetect scene analysis on selected episodes."""
    def run_job():
        for ep_id in payload.episode_ids:
            try:
                analyze_episode_scenes(
                    ep_id,
                    detector_type=payload.detector_type,
                    threshold=payload.threshold,
                    min_scene_len_sec=payload.min_scene_len_sec
                )
            except Exception as e:
                print(f"Error analyzing episode {ep_id}: {str(e)}")

    background_tasks.add_task(run_job)
    return {"status": "started", "episode_ids": payload.episode_ids}

@router.delete("/{episode_id}")
def delete_episode(episode_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM episodes WHERE id = ?", (episode_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "deleted_id": episode_id}
