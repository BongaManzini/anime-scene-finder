import sqlite3
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection

def search_scenes(
    query: Optional[str] = None,
    anime_title: Optional[str] = None,
    character_name: Optional[str] = None,
    mood: Optional[str] = None,
    action: Optional[str] = None,
    tag: Optional[str] = None,
    min_confidence: float = 0.0,
    episode_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Searches scenes using hybrid SQLite FTS5 text matching, tag filtering, and metadata filters.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if episode_id:
        conditions.append("s.episode_id = ?")
        params.append(episode_id)

    if anime_title and anime_title != "All":
        conditions.append("a.title LIKE ?")
        params.append(f"%{anime_title}%")

    if mood and mood != "All":
        conditions.append("s.mood_tags LIKE ?")
        params.append(f"%{mood}%")

    if action and action != "All":
        conditions.append("s.action_tags LIKE ?")
        params.append(f"%{action}%")

    if tag:
        conditions.append("(s.user_tags LIKE ? OR s.mood_tags LIKE ? OR s.action_tags LIKE ?)")
        params.extend([f"%{tag}%", f"%{tag}%", f"%{tag}%"])

    if character_name and character_name != "All":
        conditions.append("""
        s.id IN (
            SELECT cd.scene_id FROM character_detections cd
            JOIN characters c ON cd.character_id = c.id
            WHERE c.name LIKE ? AND cd.confidence >= ?
        )
        """)
        params.extend([f"%{character_name}%", min_confidence])

    # Search Query logic
    fts_scene_ids = []
    if query and query.strip():
        clean_q = query.strip().replace('"', '""')
        # Split terms for wildcard match
        terms = [f"{t}*" for t in clean_q.split() if t.strip()]
        fts_expr = " AND ".join(terms) if terms else f"{clean_q}*"

        try:
            fts_query = """
            SELECT scene_id, rank 
            FROM scenes_fts 
            WHERE scenes_fts MATCH ? 
            ORDER BY rank
            """
            cursor.execute(fts_query, (fts_expr,))
            fts_rows = cursor.fetchall()
            fts_scene_ids = [r["scene_id"] for r in fts_rows]
        except sqlite3.OperationalError:
            # Fallback to LIKE if FTS query syntax error
            pass

        if fts_scene_ids:
            placeholders = ",".join(["?"] * len(fts_scene_ids))
            conditions.append(f"s.id IN ({placeholders})")
            params.extend(fts_scene_ids)
        else:
            # Fallback LIKE search across description, tags, subtitle text
            conditions.append("""
            (s.description LIKE ? OR s.mood_tags LIKE ? OR s.action_tags LIKE ? OR s.user_tags LIKE ? OR s.id IN (
                SELECT scene_id FROM subtitles WHERE text LIKE ?
            ))
            """)
            q_like = f"%{query.strip()}%"
            params.extend([q_like, q_like, q_like, q_like, q_like])

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    sql = f"""
    SELECT 
        s.*, 
        e.filename, 
        e.season_num, 
        e.episode_num, 
        a.title as anime_title,
        a.id as anime_id
    FROM scenes s
    JOIN episodes e ON s.episode_id = e.id
    JOIN anime a ON e.anime_id = a.id
    {where_clause}
    ORDER BY s.episode_id ASC, s.scene_number ASC
    LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    cursor.execute(sql, params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        sc_id = r["id"]
        # Fetch associated characters
        cursor.execute("""
        SELECT c.name, cd.confidence, cd.confirmed_by_user 
        FROM character_detections cd 
        JOIN characters c ON cd.character_id = c.id 
        WHERE cd.scene_id = ?
        """, (sc_id,))
        chars = [f"{c['name']} ({int(c['confidence']*100)}%)" for c in cursor.fetchall()]

        # Fetch dialogue sample
        cursor.execute("SELECT text FROM subtitles WHERE scene_id = ? LIMIT 3", (sc_id,))
        subs = [sub["text"] for sub in cursor.fetchall()]

        results.append({
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
        })

    conn.close()
    return results
