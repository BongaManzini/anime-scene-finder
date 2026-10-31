import os
import subprocess
import pytest
from backend.app.database import init_db, get_db_connection
from backend.app.services.video_service import extract_video_metadata
from backend.app.services.scene_service import analyze_episode_scenes
from backend.app.services.search_service import search_scenes
from backend.app.services.export_service import export_scene_clip

@pytest.fixture(scope="module")
def sample_video(tmp_path_factory):
    """Generates a synthetic 6-second video file with 2 distinct color cuts for testing."""
    tmp_dir = tmp_path_factory.mktemp("video")
    video_path = str(tmp_dir / "Test_Anime_S01E01.mp4")

    # Generate 3s red color + 3s blue color video via ffmpeg lavfi
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "color=c=red:duration=3:size=640x360:rate=30",
        "-f", "lavfi", "-i", "color=c=blue:duration=3:size=640x360:rate=30",
        "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]",
        "-map", "[v]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        video_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert res.returncode == 0
    assert os.path.exists(video_path)
    return video_path

def test_full_pipeline_flow(sample_video, tmp_path):
    # Set DB path for test
    os.environ["DATABASE_PATH"] = str(tmp_path / "test.db")
    init_db()

    # 1. Extract metadata
    meta = extract_video_metadata(sample_video)
    assert meta["duration"] >= 5.0
    assert meta["resolution"] == "640x360"

    # 2. Insert into DB
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO anime (title) VALUES ('Test Anime')")
    c.execute("SELECT id FROM anime WHERE title = 'Test Anime'")
    anime_id = c.fetchone()["id"]
    c.execute("""
    INSERT INTO episodes (anime_id, filepath, filename, season_num, episode_num, duration, resolution, fps, size_bytes, format, status)
    VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?, 'unprocessed')
    """, (anime_id, meta["filepath"], meta["filename"], meta["duration"], meta["resolution"], meta["fps"], meta["size_bytes"], meta["format"]))
    ep_id = c.lastrowid
    conn.commit()
    conn.close()

    # 3. Run Scene Detection
    scenes = analyze_episode_scenes(ep_id, threshold=15.0, min_scene_len_sec=0.5)
    assert len(scenes) >= 1

    # 4. Test Search Service
    search_res = search_scenes(anime_title="Test Anime")
    assert len(search_res) >= 1

    # 5. Test Export Clip
    first_sc_id = search_res[0]["id"]
    export_res = export_scene_clip(first_sc_id, str(tmp_path / "exports"), resolution="original")
    assert os.path.exists(export_res["output_path"])
    assert export_res["duration_sec"] > 0
