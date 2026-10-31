from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection
from backend.app.models import ProjectCreate, ProjectOut, ProjectSectionCreate, ProjectAddScene

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectOut])
def list_projects():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("", response_model=ProjectOut)
def create_project(payload: ProjectCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO projects (name, anime_title, character_name, song_title, song_filepath, thesis)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (payload.name, payload.anime_title, payload.character_name, payload.song_title, payload.song_filepath, payload.thesis))

    proj_id = cursor.lastrowid

    # Default starter sections
    default_sections = ["Introduction", "Personality & Highlights", "Key Relationships", "Peak Climax", "Ending & Legacy"]
    for idx, sec_title in enumerate(default_sections):
        cursor.execute("""
        INSERT INTO project_sections (project_id, title, sort_order)
        VALUES (?, ?, ?)
        """, (proj_id, sec_title, idx + 1))

    conn.commit()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
    row = cursor.fetchone()
    conn.close()

    return dict(row)

@router.get("/{project_id}")
def get_project_details(project_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch sections
    cursor.execute("SELECT * FROM project_sections WHERE project_id = ? ORDER BY sort_order ASC", (project_id,))
    sections = [dict(s) for s in cursor.fetchall()]

    # Fetch scenes in project
    for sec in sections:
        sec_id = sec["id"]
        cursor.execute("""
        SELECT ps.*, s.thumbnail_path, s.start_timestamp, s.end_timestamp, s.description, 
               e.filename, a.title as anime_title
        FROM project_scenes ps
        JOIN scenes s ON ps.scene_id = s.id
        JOIN episodes e ON s.episode_id = e.id
        JOIN anime a ON e.anime_id = a.id
        WHERE ps.project_id = ? AND ps.section_id = ?
        ORDER BY ps.sort_order ASC
        """, (project_id, sec_id))
        sec["scenes"] = [dict(sc) for sc in cursor.fetchall()]

    conn.close()

    res = dict(proj)
    res["sections"] = sections
    return res

@router.post("/{project_id}/add-scene")
def add_scene_to_project(project_id: int, payload: ProjectAddScene):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if section provided, or put into first section
    section_id = payload.section_id
    if not section_id:
        cursor.execute("SELECT id FROM project_sections WHERE project_id = ? ORDER BY sort_order ASC LIMIT 1", (project_id,))
        sec_row = cursor.fetchone()
        if sec_row:
            section_id = sec_row["id"]

    cursor.execute("""
    INSERT INTO project_scenes (project_id, section_id, scene_id, in_point_sec, out_point_sec)
    VALUES (?, ?, ?, ?, ?)
    """, (project_id, section_id, payload.scene_id, payload.in_point_sec, payload.out_point_sec))

    conn.commit()
    conn.close()
    return {"status": "success", "project_id": project_id, "scene_id": payload.scene_id}

@router.get("/{project_id}/ai-recommendations")
def get_ai_recommendations(project_id: int):
    try:
        from backend.app.services.ai_service import recommend_amv_scenes
        return recommend_amv_scenes(project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI recommendation failed: {str(e)}")

@router.delete("/{project_id}")
def delete_project(project_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "deleted_id": project_id}
