import os
import subprocess
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection

def export_scene_clip(
    scene_id: int,
    output_dir: str,
    resolution: str = "original",
    custom_name: Optional[str] = None,
    in_point_sec: Optional[float] = None,
    out_point_sec: Optional[float] = None
) -> Dict[str, Any]:
    """
    Exports a single scene clip using FFmpeg.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.*, e.filepath, e.filename, a.title as anime_title
    FROM scenes s
    JOIN episodes e ON s.episode_id = e.id
    JOIN anime a ON e.anime_id = a.id
    WHERE s.id = ?
    """, (scene_id,))
    scene = cursor.fetchone()
    conn.close()

    if not scene:
        raise ValueError(f"Scene ID {scene_id} not found.")

    source_path = scene["filepath"]
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source video file not found: {source_path}")

    start_sec = in_point_sec if in_point_sec is not None else scene["start_time_sec"]
    end_sec = out_point_sec if out_point_sec is not None else scene["end_time_sec"]
    duration_sec = max(0.5, end_sec - start_sec)

    os.makedirs(output_dir, exist_ok=True)

    clean_anime = "".join([c for c in scene["anime_title"] if c.isalnum() or c in (" ", "_", "-")]).strip()
    if not custom_name:
        custom_name = f"{clean_anime}_S{scene['scene_number']:03d}_{scene['start_timestamp'].replace(':', '-')}.mp4"

    if not custom_name.endswith(".mp4"):
        custom_name += ".mp4"

    output_path = os.path.join(output_dir, custom_name)

    # Resolution scaling flags
    vf_flags = []
    if resolution == "1080p":
        vf_flags = ["-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"]
    elif resolution == "720p":
        vf_flags = ["-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2"]

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_sec),
        "-i", source_path,
        "-t", str(duration_sec),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k"
    ] + vf_flags + [output_path]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg clip export failed: {result.stderr}")

    return {
        "scene_id": scene_id,
        "output_path": os.path.abspath(output_path),
        "filename": custom_name,
        "duration_sec": round(duration_sec, 2),
        "resolution": resolution
    }

def batch_export_scenes(
    scene_ids: List[int],
    output_directory: Optional[str] = None,
    resolution: str = "original",
    project_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Exports multiple scenes into an organized folder structure.
    """
    if not output_directory:
        output_directory = os.path.abspath("data/exports")

    folder_name = "Scene_Clips"
    if project_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM projects WHERE id = ?", (project_id,))
        proj = cursor.fetchone()
        conn.close()
        if proj:
            clean_proj = "".join([c for c in proj["name"] if c.isalnum() or c in (" ", "_", "-")]).strip()
            folder_name = clean_proj

    target_dir = os.path.join(output_directory, folder_name)
    os.makedirs(target_dir, exist_ok=True)

    exported_clips = []
    for idx, sc_id in enumerate(scene_ids):
        custom_name = f"Clip_{idx+1:03d}_Scene_{sc_id}.mp4"
        res = export_scene_clip(sc_id, target_dir, resolution=resolution, custom_name=custom_name)
        exported_clips.append(res)

    return exported_clips
