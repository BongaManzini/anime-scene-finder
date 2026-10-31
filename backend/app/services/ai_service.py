import os
import sqlite3
import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection

# Lazy loading for SentenceTransformers to keep startup fast
_sentence_model = None

def get_embedding_model():
    global _sentence_model
    if _sentence_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Lightweight semantic embedding model
            _sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"SentenceTransformers loading warning: {e}")
            _sentence_model = None
    return _sentence_model

def compute_text_embedding(text: str) -> Optional[List[float]]:
    model = get_embedding_model()
    if model is None or not text.strip():
        return None
    emb = model.encode(text)
    return emb.tolist()

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    a = np.array(vec1)
    b = np.array(vec2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def auto_detect_moods_and_actions(text_content: str) -> Dict[str, List[str]]:
    """
    Classifies text & dialogue into AMV emotions and actions.
    """
    text_lower = text_content.lower()

    emotions_keywords = {
        "Happy": ["smile", "laugh", "happy", "joy", "cheer", "fun", "funny", "joke"],
        "Sad": ["sad", "cry", "tears", "tragedy", "loss", "grief", "death", "sorry"],
        "Angry": ["angry", "rage", "yell", "shout", "hate", "destroy", "kill", "damn"],
        "Lonely": ["alone", "lonely", "darkness", "silence", "isolation", "abandoned"],
        "Excited": ["excited", "hype", "power", "go", "win", "ultimate", "super"],
        "Afraid": ["fear", "afraid", "scared", "terror", "run", "help", "danger"],
        "Calm": ["calm", "peace", "rest", "breeze", "quiet", "relax", "sleep"],
        "Confident": ["strong", "confident", "smile", "easy", "win", "master", "king"],
        "Emotional": ["promise", "heart", "love", "remember", "never", "forever"]
    }

    actions_keywords = {
        "Fighting": ["fight", "punch", "sword", "strike", "attack", "battle", "clash", "kick"],
        "Walking": ["walk", "stroll", "step", "path", "road"],
        "Running": ["run", "sprint", "chase", "dash", "escape"],
        "Talking": ["talk", "say", "speak", "tell", "listen", "chat", "voice"],
        "Laughing": ["haha", "laugh", "smile", "chuckle", "giggle"],
        "Crying": ["cry", "tear", "sob", "weep"],
        "Dancing": ["dance", "rhythm", "music", "sing", "song", "beat", "chika"],
        "Training": ["train", "practice", "workout", "exercise", "stronger", "pushups"],
        "Sleeping": ["sleep", "bed", "dream", "tired", "nap"],
        "Eating": ["eat", "food", "meat", "dinner", "delicious", "hungry"]
    }

    detected_moods = [m for m, kw_list in emotions_keywords.items() if any(k in text_lower for k in kw_list)]
    detected_actions = [a for a, kw_list in actions_keywords.items() if any(k in text_lower for k in kw_list)]

    return {
        "moods": detected_moods,
        "actions": detected_actions
    }

def recommend_amv_scenes(
    project_id: int,
    limit_per_section: int = 4
) -> Dict[str, Any]:
    """
    Smart AMV AI Assistant: Recommends scenes from user's indexed library
    matching the project thesis and section titles.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise ValueError(f"Project {project_id} not found.")

    cursor.execute("SELECT * FROM project_sections WHERE project_id = ? ORDER BY sort_order ASC", (project_id,))
    sections = [dict(s) for s in cursor.fetchall()]

    # Fetch candidate scenes
    cursor.execute("""
    SELECT s.*, e.filename, a.title as anime_title
    FROM scenes s
    JOIN episodes e ON s.episode_id = e.id
    JOIN anime a ON e.anime_id = a.id
    ORDER BY s.id DESC
    LIMIT 100
    """)
    all_scenes = [dict(r) for r in cursor.fetchall()]
    conn.close()

    model = get_embedding_model()
    recommendations = {}

    for sec in sections:
        sec_title = sec["title"]
        target_query = f"{proj['character_name'] or ''} {sec_title} {proj['thesis'] or ''}".strip()
        
        target_vec = compute_text_embedding(target_query) if model else None

        scored_scenes = []
        for sc in all_scenes:
            sc_text = f"{sc['anime_title']} {sc['description']} {sc['mood_tags']} {sc['action_tags']} {sc['user_tags']}"
            
            score = 0.5
            if target_vec and model:
                sc_vec = compute_text_embedding(sc_text)
                if sc_vec:
                    score = cosine_similarity(target_vec, sc_vec)
            else:
                # Heuristic keyword match score
                query_words = target_query.lower().split()
                matched = sum(1 for w in query_words if w in sc_text.lower())
                score = round(matched / max(1, len(query_words)), 2)

            scored_scenes.append((score, sc))

        scored_scenes.sort(key=lambda x: x[0], reverse=True)
        top_scenes = [
            {
                "scene_id": item[1]["id"],
                "score": round(item[0] * 100, 1),
                "anime_title": item[1]["anime_title"],
                "filename": item[1]["filename"],
                "start_timestamp": item[1]["start_timestamp"],
                "end_timestamp": item[1]["end_timestamp"],
                "thumbnail_path": item[1]["thumbnail_path"],
                "description": item[1]["description"],
                "reason": f"Matches section '{sec_title}' with {int(item[0]*100)}% relevance"
            }
            for item in scored_scenes[:limit_per_section]
        ]
        recommendations[sec_title] = top_scenes

    return {
        "project_id": project_id,
        "project_name": proj["name"],
        "thesis": proj["thesis"],
        "recommendations": recommendations
    }
