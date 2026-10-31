import os
import subprocess
import sqlite3
from typing import List, Dict, Any, Callable
from scenedetect import detect, ContentDetector, ThresholdDetector
from backend.app.database import get_db_connection

def format_timestamp(seconds: float) -> str:
    """Converts seconds into HH:MM:SS format."""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hrs > 0:
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"

def extract_frame(video_path: str, timestamp_sec: float, output_path: str) -> bool:
    """Extracts a single image frame at timestamp_sec using ffmpeg."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(max(0, timestamp_sec)),
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        output_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0 and os.path.exists(output_path)

def analyze_episode_scenes(
    episode_id: int,
    detector_type: str = "content",
    threshold: float = 27.0,
    min_scene_len_sec: float = 1.5,
    progress_callback: Callable[[float, str], None] = None
) -> List[Dict[str, Any]]:
    """
    Detects scene boundaries in an episode using PySceneDetect, extracts thumbnail images,
    and updates the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get episode details
    cursor.execute("""
    SELECT e.*, a.title as anime_title 
    FROM episodes e 
    JOIN anime a ON e.anime_id = a.id 
    WHERE e.id = ?
    """, (episode_id,))
    episode = cursor.fetchone()

    if not episode:
        conn.close()
        raise ValueError(f"Episode ID {episode_id} not found.")

    video_path = episode["filepath"]
    if not os.path.exists(video_path):
        conn.close()
        raise FileNotFoundError(f"Video file missing: {video_path}")

    # Mark status as analyzing
    cursor.execute("UPDATE episodes SET status = 'analyzing' WHERE id = ?", (episode_id,))
    conn.commit()

    if progress_callback:
        progress_callback(10, "Detecting visual scene boundaries...")

    # PySceneDetect detection
    detector = ContentDetector(threshold=threshold, min_scene_len=int(min_scene_len_sec * 24))
    if detector_type == "threshold":
        detector = ThresholdDetector(threshold=threshold)

    try:
        scene_list = detect(video_path, detector)
    except Exception as e:
        cursor.execute("UPDATE episodes SET status = 'error' WHERE id = ?", (episode_id,))
        conn.commit()
        conn.close()
        raise RuntimeError(f"Scene detection failed: {str(e)}")

    if progress_callback:
        progress_callback(50, f"Detected {len(scene_list)} scenes. Extracting thumbnails...")

    # Clear previous scenes for this episode if any
    cursor.execute("DELETE FROM scenes WHERE episode_id = ?", (episode_id,))
    conn.commit()

    saved_scenes = []
    total_scenes = len(scene_list)

    for i, (start_time, end_time) in enumerate(scene_list):
        scene_num = i + 1
        start_sec = round(start_time.seconds if hasattr(start_time, 'seconds') else start_time.get_seconds(), 2)
        end_sec = round(end_time.seconds if hasattr(end_time, 'seconds') else end_time.get_seconds(), 2)

        start_ts = format_timestamp(start_sec)
        end_ts = format_timestamp(end_sec)

        # Thumbnail path
        thumb_filename = f"ep_{episode_id}_scene_{scene_num:03d}.jpg"
        thumb_rel_path = f"/thumbnails/{thumb_filename}"
        thumb_abs_path = os.path.abspath(f"data/thumbnails/{thumb_filename}")

        # Extract frame from middle of scene
        mid_sec = start_sec + (end_sec - start_sec) / 2.0
        extract_frame(video_path, mid_sec, thumb_abs_path)

        # Initial default description/tags
        description = f"Scene {scene_num} ({start_ts} -> {end_ts})"

        cursor.execute("""
        INSERT INTO scenes (
            episode_id, scene_number, start_time_sec, end_time_sec, 
            start_timestamp, end_timestamp, thumbnail_path, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (episode_id, scene_num, start_sec, end_sec, start_ts, end_ts, thumb_rel_path, description))

        scene_id = cursor.lastrowid

        # Update FTS5 index
        cursor.execute("""
        INSERT INTO scenes_fts (
            scene_id, anime_title, filename, description, mood_tags, action_tags, user_tags, subtitle_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (scene_id, episode["anime_title"], episode["filename"], description, "", "", "", ""))

        saved_scenes.append({
            "id": scene_id,
            "scene_number": scene_num,
            "start_time_sec": start_sec,
            "end_time_sec": end_sec,
            "start_timestamp": start_ts,
            "end_timestamp": end_ts,
            "thumbnail_path": thumb_rel_path,
            "description": description
        })

        if progress_callback and total_scenes > 0:
            pct = 50 + int((i + 1) / total_scenes * 40)
            progress_callback(pct, f"Processed scene {scene_num}/{total_scenes}")

    # Mark episode as ready
    cursor.execute("""
    UPDATE episodes 
    SET status = 'ready', analyzed_at = CURRENT_TIMESTAMP 
    WHERE id = ?
    """, (episode_id,))

    conn.commit()
    conn.close()

    if progress_callback:
        progress_callback(100, "Scene analysis completed!")

    return saved_scenes
