import sqlite3
import os
from typing import Generator
import json

DB_PATH = os.getenv("DATABASE_PATH", os.path.abspath("data/anime_scene_finder.db"))

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Anime table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS anime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Episodes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anime_id INTEGER NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
        filepath TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        season_num INTEGER DEFAULT 1,
        episode_num INTEGER DEFAULT 1,
        duration REAL DEFAULT 0.0,
        resolution TEXT,
        fps REAL DEFAULT 0.0,
        size_bytes INTEGER DEFAULT 0,
        format TEXT,
        status TEXT DEFAULT 'unprocessed',
        analyzed_at DATETIME
    );
    """)

    # Scenes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
        scene_number INTEGER NOT NULL,
        start_time_sec REAL NOT NULL,
        end_time_sec REAL NOT NULL,
        start_timestamp TEXT NOT NULL,
        end_timestamp TEXT NOT NULL,
        thumbnail_path TEXT,
        description TEXT,
        mood_tags TEXT DEFAULT '',
        action_tags TEXT DEFAULT '',
        user_tags TEXT DEFAULT '',
        is_favorite INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Subtitles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subtitles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
        scene_id INTEGER REFERENCES scenes(id) ON DELETE SET NULL,
        start_time_sec REAL NOT NULL,
        end_time_sec REAL NOT NULL,
        speaker TEXT,
        text TEXT NOT NULL
    );
    """)

    # Characters table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        ref_images TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Character Detections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS character_detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
        character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        confidence REAL DEFAULT 0.0,
        confirmed_by_user INTEGER DEFAULT 0,
        UNIQUE(scene_id, character_id)
    );
    """)

    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        anime_title TEXT,
        character_name TEXT,
        song_title TEXT,
        song_filepath TEXT,
        song_duration REAL DEFAULT 0.0,
        thesis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Project Sections
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS project_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        start_time_sec REAL DEFAULT 0.0,
        end_time_sec REAL DEFAULT 0.0,
        sort_order INTEGER DEFAULT 0
    );
    """)

    # Project Scenes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS project_scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        section_id INTEGER REFERENCES project_sections(id) ON DELETE SET NULL,
        scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
        in_point_sec REAL,
        out_point_sec REAL,
        sort_order INTEGER DEFAULT 0
    );
    """)

    # Collections
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
    );
    """)

    # Collection Scenes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS collection_scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
        UNIQUE(collection_id, scene_id)
    );
    """)

    # Full Text Search (FTS5) for Scenes & Dialogue
    cursor.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS scenes_fts USING fts5(
        scene_id UNINDEXED,
        anime_title,
        filename,
        description,
        mood_tags,
        action_tags,
        user_tags,
        subtitle_text
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
