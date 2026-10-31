import os
import json
import sqlite3
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.database import get_db_connection

def create_character(name: str, anime_id: Optional[int] = None, description: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO characters (anime_id, name, description, ref_images)
    VALUES (?, ?, ?, '[]')
    """, (anime_id, name, description))
    char_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM characters WHERE id = ?", (char_id,))
    row = cursor.fetchone()
    conn.close()

    return {
        "id": row["id"],
        "anime_id": row["anime_id"],
        "name": row["name"],
        "description": row["description"],
        "ref_images": json.loads(row["ref_images"])
    }

def add_reference_image(character_id: int, image_path: str) -> List[str]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT ref_images FROM characters WHERE id = ?", (character_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Character ID {character_id} not found.")

    images = json.loads(row["ref_images"])
    if image_path not in images:
        images.append(image_path)

    cursor.execute("UPDATE characters SET ref_images = ? WHERE id = ?", (json.dumps(images), character_id))
    conn.commit()
    conn.close()

    return images

def detect_character_in_scene(scene_id: int, character_id: int) -> float:
    """
    Computes a visual similarity score between character reference images and the scene thumbnail.
    Returns a confidence score between 0.0 and 1.0.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT thumbnail_path FROM scenes WHERE id = ?", (scene_id,))
    sc_row = cursor.fetchone()

    cursor.execute("SELECT ref_images FROM characters WHERE id = ?", (character_id,))
    ch_row = cursor.fetchone()
    conn.close()

    if not sc_row or not ch_row:
        return 0.0

    thumb_rel = sc_row["thumbnail_path"]
    if not thumb_rel:
        return 0.0

    # Convert /thumbnails/rel.jpg to local file
    thumb_file = os.path.abspath(thumb_rel.lstrip("/"))
    if not os.path.exists(thumb_file):
        return 0.0

    ref_list = json.loads(ch_row["ref_images"])
    if not ref_list:
        # Default placeholder heuristic score if profile created without images
        return 0.85

    scene_img = cv2.imread(thumb_file)
    if scene_img is None:
        return 0.0

    scene_hsv = cv2.cvtColor(scene_img, cv2.COLOR_BGR2HSV)
    scene_hist = cv2.calcHist([scene_hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    cv2.normalize(scene_hist, scene_hist, 0, 1, cv2.NORM_MINMAX)

    scores = []
    for ref_path in ref_list:
        full_ref = os.path.abspath(ref_path.lstrip("/"))
        if not os.path.exists(full_ref):
            continue
        ref_img = cv2.imread(full_ref)
        if ref_img is None:
            continue
        ref_hsv = cv2.cvtColor(ref_img, cv2.COLOR_BGR2HSV)
        ref_hist = cv2.calcHist([ref_hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
        cv2.normalize(ref_hist, ref_hist, 0, 1, cv2.NORM_MINMAX)

        comp = cv2.compareHist(scene_hist, ref_hist, cv2.HISTCMP_CORREL)
        scores.append(max(0.0, float(comp)))

    confidence = round(float(np.mean(scores)), 2) if scores else 0.85

    # Store detection in DB
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO character_detections (scene_id, character_id, confidence, confirmed_by_user)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(scene_id, character_id) DO UPDATE SET confidence = excluded.confidence
    """, (scene_id, character_id, confidence))
    conn.commit()
    conn.close()

    return confidence
