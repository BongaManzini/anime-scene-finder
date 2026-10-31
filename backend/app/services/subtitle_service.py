import os
import re
import sqlite3
import pysrt
import webvtt
from typing import List, Dict, Any
from backend.app.database import get_db_connection

def parse_srt(filepath: str) -> List[Dict[str, Any]]:
    subs = pysrt.open(filepath)
    items = []
    for sub in subs:
        start_sec = sub.start.ordinal / 1000.0
        end_sec = sub.end.ordinal / 1000.0
        text = sub.text.strip()
        if text:
            items.append({
                "start_time_sec": round(start_sec, 2),
                "end_time_sec": round(end_sec, 2),
                "speaker": None,
                "text": text
            })
    return items

def parse_vtt(filepath: str) -> List[Dict[str, Any]]:
    items = []
    for caption in webvtt.read(filepath):
        # convert HH:MM:SS.mmm to seconds
        def to_sec(ts):
            parts = ts.split(":")
            if len(parts) == 3:
                return float(parts[0])*3600 + float(parts[1])*60 + float(parts[2])
            elif len(parts) == 2:
                return float(parts[0])*60 + float(parts[1])
            return 0.0

        start_sec = to_sec(caption.start)
        end_sec = to_sec(caption.end)
        text = caption.text.strip()
        if text:
            items.append({
                "start_time_sec": round(start_sec, 2),
                "end_time_sec": round(end_sec, 2),
                "speaker": None,
                "text": text
            })
    return items

def parse_ass(filepath: str) -> List[Dict[str, Any]]:
    """Simple parser for ASS/SSA subtitle format."""
    items = []
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    in_events = False
    format_headers = []

    for line in lines:
        line = line.strip()
        if line.startswith("[Events]"):
            in_events = True
            continue
        if in_events:
            if line.startswith("Format:"):
                format_headers = [h.strip().lower() for h in line.replace("Format:", "").split(",")]
            elif line.startswith("Dialogue:"):
                parts = line.replace("Dialogue:", "", 1).split(",", len(format_headers) - 1)
                if len(parts) >= 9:
                    # Default ASS fields: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                    start_str = parts[1].strip()
                    end_str = parts[2].strip()
                    speaker = parts[4].strip() if parts[4].strip() else None
                    raw_text = parts[-1].strip()

                    # Clean ASS tags like {\pos(100,200)}
                    clean_text = re.sub(r'\{.*?\}', '', raw_text).replace(r'\N', ' ').replace(r'\n', ' ').strip()

                    def ass_to_sec(ts):
                        p = ts.split(":")
                        if len(p) == 3:
                            return float(p[0])*3600 + float(p[1])*60 + float(p[2])
                        return 0.0

                    start_sec = ass_to_sec(start_str)
                    end_sec = ass_to_sec(end_str)

                    if clean_text:
                        items.append({
                            "start_time_sec": round(start_sec, 2),
                            "end_time_sec": round(end_sec, 2),
                            "speaker": speaker,
                            "text": clean_text
                        })

    return items

def import_episode_subtitles(episode_id: int, filepath: str) -> int:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Subtitle file not found: {filepath}")

    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".srt":
        subs = parse_srt(filepath)
    elif ext == ".vtt":
        subs = parse_vtt(filepath)
    elif ext in [".ass", ".ssa"]:
        subs = parse_ass(filepath)
    else:
        raise ValueError(f"Unsupported subtitle format: {ext}")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear old subtitles for this episode
    cursor.execute("DELETE FROM subtitles WHERE episode_id = ?", (episode_id,))

    # Get episode's scenes
    cursor.execute("SELECT id, start_time_sec, end_time_sec FROM scenes WHERE episode_id = ?", (episode_id,))
    scenes = cursor.fetchall()

    for item in subs:
        # Match subtitle with scene
        matched_scene_id = None
        s_mid = (item["start_time_sec"] + item["end_time_sec"]) / 2.0

        for sc in scenes:
            if sc["start_time_sec"] <= s_mid <= sc["end_time_sec"]:
                matched_scene_id = sc["id"]
                break

        cursor.execute("""
        INSERT INTO subtitles (episode_id, scene_id, start_time_sec, end_time_sec, speaker, text)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (episode_id, matched_scene_id, item["start_time_sec"], item["end_time_sec"], item["speaker"], item["text"]))

    # Aggregate subtitle text per scene and update FTS5
    for sc in scenes:
        cursor.execute("SELECT text FROM subtitles WHERE scene_id = ?", (sc["id"],))
        sub_texts = [row["text"] for row in cursor.fetchall()]
        full_sub_text = " ".join(sub_texts)

        # Update FTS5 index entry for scene
        cursor.execute("""
        UPDATE scenes_fts SET subtitle_text = ? WHERE scene_id = ?
        """, (full_sub_text, sc["id"]))

    conn.commit()
    conn.close()
    return len(subs)
