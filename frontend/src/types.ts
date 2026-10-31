export interface Anime {
  id: number;
  title: string;
  description?: string;
  created_at: string;
}

export interface Episode {
  id: number;
  anime_id: number;
  anime_title?: string;
  filepath: string;
  filename: string;
  season_num: number;
  episode_num: number;
  duration: number;
  resolution: string;
  fps: number;
  size_bytes: number;
  format: string;
  status: 'unprocessed' | 'analyzing' | 'ready' | 'error';
  analyzed_at?: string;
  scene_count?: number;
}

export interface Scene {
  id: number;
  episode_id: number;
  anime_title?: string;
  filename?: string;
  season_num?: number;
  episode_num?: number;
  scene_number: number;
  start_time_sec: number;
  end_time_sec: number;
  start_timestamp: string;
  end_timestamp: string;
  thumbnail_path?: string;
  description?: string;
  mood_tags?: string;
  action_tags?: string;
  user_tags?: string;
  is_favorite?: boolean;
  characters?: string[];
  subtitles?: string[];
}

export interface Character {
  id: number;
  anime_id?: number;
  name: string;
  description?: string;
  ref_images?: string[];
}

export interface ProjectSection {
  id: number;
  project_id: number;
  title: string;
  start_time_sec: number;
  end_time_sec: number;
  sort_order: number;
  scenes?: any[];
}

export interface Project {
  id: number;
  name: string;
  anime_title?: string;
  character_name?: string;
  song_title?: string;
  song_filepath?: string;
  song_duration?: number;
  thesis?: string;
  created_at: string;
  sections?: ProjectSection[];
}

export interface SearchFilters {
  q?: string;
  anime?: string;
  character?: string;
  mood?: string;
  action?: string;
  tag?: string;
  min_confidence?: number;
  episode_id?: number;
  limit?: number;
}
