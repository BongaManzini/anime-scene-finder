from pydantic import BaseModel, Field
from typing import List, Optional

# Anime Models
class AnimeCreate(BaseModel):
    title: str
    description: Optional[str] = None

class AnimeOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: str

# Episode Models
class EpisodeImport(BaseModel):
    filepaths: List[str]
    anime_title: Optional[str] = None
    season_num: Optional[int] = None

class EpisodeUpdate(BaseModel):
    anime_id: Optional[int] = None
    season_num: Optional[int] = None
    episode_num: Optional[int] = None

class EpisodeOut(BaseModel):
    id: int
    anime_id: int
    anime_title: Optional[str] = None
    filepath: str
    filename: str
    season_num: int
    episode_num: int
    duration: float
    resolution: str
    fps: float
    size_bytes: int
    format: str
    status: str
    analyzed_at: Optional[str] = None
    scene_count: Optional[int] = 0

# Scene Models
class SceneTagUpdate(BaseModel):
    mood_tags: Optional[str] = None
    action_tags: Optional[str] = None
    user_tags: Optional[str] = None
    description: Optional[str] = None
    is_favorite: Optional[bool] = None

class SceneOut(BaseModel):
    id: int
    episode_id: int
    anime_title: Optional[str] = None
    filename: Optional[str] = None
    season_num: Optional[int] = None
    episode_num: Optional[int] = None
    scene_number: int
    start_time_sec: float
    end_time_sec: float
    start_timestamp: str
    end_timestamp: str
    thumbnail_path: Optional[str] = None
    description: Optional[str] = ""
    mood_tags: Optional[str] = ""
    action_tags: Optional[str] = ""
    user_tags: Optional[str] = ""
    is_favorite: bool = False
    characters: Optional[List[str]] = []
    subtitles: Optional[List[str]] = []

# Character Models
class CharacterCreate(BaseModel):
    anime_id: Optional[int] = None
    name: str
    description: Optional[str] = None

class CharacterDetectionConfirm(BaseModel):
    scene_id: int
    character_id: int
    confirmed: int # 1 = confirmed, -1 = rejected, 0 = unconfirmed

class CharacterOut(BaseModel):
    id: int
    anime_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    ref_images: List[str] = []

# Subtitle Models
class SubtitleImport(BaseModel):
    episode_id: int
    filepath: str

# Project Models
class ProjectCreate(BaseModel):
    name: str
    anime_title: Optional[str] = None
    character_name: Optional[str] = None
    song_title: Optional[str] = None
    song_filepath: Optional[str] = None
    thesis: Optional[str] = None

class ProjectSectionCreate(BaseModel):
    title: str
    start_time_sec: float = 0.0
    end_time_sec: float = 0.0
    sort_order: int = 0

class ProjectAddScene(BaseModel):
    scene_id: int
    section_id: Optional[int] = None
    in_point_sec: Optional[float] = None
    out_point_sec: Optional[float] = None

class ProjectOut(BaseModel):
    id: int
    name: str
    anime_title: Optional[str] = None
    character_name: Optional[str] = None
    song_title: Optional[str] = None
    song_filepath: Optional[str] = None
    song_duration: float = 0.0
    thesis: Optional[str] = None
    created_at: str

# Collection Models
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionAddScene(BaseModel):
    scene_id: int

# Export Models
class ClipExportRequest(BaseModel):
    scene_ids: List[int]
    output_directory: Optional[str] = None
    resolution: Optional[str] = "original" # original, 1080p, 720p
    project_id: Optional[int] = None

# Analysis Request
class AnalysisRequest(BaseModel):
    episode_ids: List[int]
    detector_type: str = "content" # content or threshold
    threshold: float = 27.0
    min_scene_len_sec: float = 1.5
    extract_subtitles: bool = True
