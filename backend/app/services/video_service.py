import os
import re
import json
import subprocess
from typing import Dict, Any, Tuple, Optional

def extract_video_metadata(filepath: str) -> Dict[str, Any]:
    """Uses ffprobe to extract technical metadata from a local video file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Video file not found: {filepath}")

    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        filepath
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFprobe failed: {result.stderr}")

    data = json.loads(result.stdout)
    format_info = data.get("format", {})
    streams = data.get("streams", [])

    video_stream = None
    for stream in streams:
        if stream.get("codec_type") == "video":
            video_stream = stream
            break

    duration = float(format_info.get("duration", 0.0))
    size_bytes = int(format_info.get("size", os.path.getsize(filepath)))
    format_name = format_info.get("format_name", "unknown")

    resolution = "Unknown"
    fps = 0.0

    if video_stream:
        width = video_stream.get("width")
        height = video_stream.get("height")
        if width and height:
            resolution = f"{width}x{height}"

        # FPS evaluation
        r_frame_rate = video_stream.get("r_frame_rate", "0/0")
        if "/" in r_frame_rate:
            num, den = r_frame_rate.split("/")
            if float(den) > 0:
                fps = round(float(num) / float(den), 2)

    return {
        "filepath": os.path.abspath(filepath),
        "filename": os.path.basename(filepath),
        "duration": round(duration, 2),
        "resolution": resolution,
        "fps": fps,
        "size_bytes": size_bytes,
        "format": format_name.split(",")[0]
    }

def parse_filename_metadata(filename: str) -> Tuple[str, int, int]:
    """
    Tries to infer Anime Title, Season Number, and Episode Number from a filename.
    Examples:
      'JoJo's Bizarre Adventure S02E12.mp4' -> ('JoJo's Bizarre Adventure', 2, 12)
      'Chika_Dance_Ep_05.mkv' -> ('Chika Dance', 1, 5)
      '[Subs] Attack on Titan - 03.mp4' -> ('Attack on Titan', 1, 3)
    """
    clean_name = os.path.splitext(filename)[0]
    clean_name = clean_name.replace("_", " ").replace(".", " ")

    # Pattern 1: S02E12 or s02e12 or 2x12
    match1 = re.search(r'(.+?)[_\s\.\-]s(\d+)\s*e(\d+)', clean_name, re.IGNORECASE)
    if match1:
        title = match1.group(1).strip()
        season = int(match1.group(2))
        episode = int(match1.group(3))
        return title, season, episode

    match1b = re.search(r'(.+?)[_\s\.\-](\d+)x(\d+)', clean_name, re.IGNORECASE)
    if match1b:
        title = match1b.group(1).strip()
        season = int(match1b.group(2))
        episode = int(match1b.group(3))
        return title, season, episode

    # Pattern 2: Ep 05 or Episode 05
    match2 = re.search(r'(.+?)[_\s\.\-](?:ep|episode)\s*(\d+)', clean_name, re.IGNORECASE)
    if match2:
        title = match2.group(1).strip()
        episode = int(match2.group(2))
        return title, 1, episode

    # Pattern 3: Title - 05
    match3 = re.search(r'(.+?)[_\s\.\-]\s*(\d{1,4})(?:\s*\[|\s*$)', clean_name)
    if match3:
        title = match3.group(1).strip()
        # Remove brackets like [1080p] or [Batch]
        title = re.sub(r'\[.*?\]', '', title).strip()
        episode = int(match3.group(2))
        return title if title else clean_name, 1, episode

    return clean_name, 1, 1
