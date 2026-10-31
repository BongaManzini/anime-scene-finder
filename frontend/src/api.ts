import { Anime, Episode, Scene, Character, Project, SearchFilters } from './types';

const API_BASE = '/api';

export async function fetchAnimeList(): Promise<Anime[]> {
  const res = await fetch(`${API_BASE}/anime`);
  if (!res.ok) throw new Error('Failed to fetch anime list');
  return res.json();
}

export async function createAnime(title: string, description?: string): Promise<Anime> {
  const res = await fetch(`${API_BASE}/anime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  });
  if (!res.ok) throw new Error('Failed to create anime');
  return res.json();
}

export async function listEpisodes(animeId?: number): Promise<Episode[]> {
  const url = animeId ? `${API_BASE}/episodes?anime_id=${animeId}` : `${API_BASE}/episodes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch episodes');
  return res.json();
}

export async function importEpisodes(filepaths: string[], animeTitle?: string, seasonNum?: number): Promise<Episode[]> {
  const res = await fetch(`${API_BASE}/episodes/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepaths, anime_title: animeTitle, season_num: seasonNum })
  });
  if (!res.ok) throw new Error('Failed to import episodes');
  return res.json();
}

export async function analyzeEpisode(episodeIds: number[], detectorType = 'content', threshold = 27.0): Promise<any> {
  const res = await fetch(`${API_BASE}/episodes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ episode_ids: episodeIds, detector_type: detectorType, threshold })
  });
  if (!res.ok) throw new Error('Failed to start episode analysis');
  return res.json();
}

export async function searchScenes(filters: SearchFilters): Promise<Scene[]> {
  const params = new URLSearchParams();
  if (filters.q) params.append('q', filters.q);
  if (filters.anime) params.append('anime', filters.anime);
  if (filters.character) params.append('character', filters.character);
  if (filters.mood) params.append('mood', filters.mood);
  if (filters.action) params.append('action', filters.action);
  if (filters.tag) params.append('tag', filters.tag);
  if (filters.min_confidence) params.append('min_confidence', filters.min_confidence.toString());
  if (filters.episode_id) params.append('episode_id', filters.episode_id.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search scenes');
  return res.json();
}

export async function updateSceneTags(sceneId: number, tags: { mood_tags?: string; action_tags?: string; user_tags?: string; description?: string; is_favorite?: boolean }): Promise<Scene> {
  const res = await fetch(`${API_BASE}/scenes/${sceneId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tags)
  });
  if (!res.ok) throw new Error('Failed to update scene tags');
  return res.json();
}

export async function listCharacters(animeId?: number): Promise<Character[]> {
  const url = animeId ? `${API_BASE}/characters?anime_id=${animeId}` : `${API_BASE}/characters`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to list characters');
  return res.json();
}

export async function createCharacter(name: string, animeId?: number, description?: string): Promise<Character> {
  const res = await fetch(`${API_BASE}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, anime_id: animeId, description })
  });
  if (!res.ok) throw new Error('Failed to create character');
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to list projects');
  return res.json();
}

export async function createProject(project: { name: string; anime_title?: string; character_name?: string; song_title?: string; thesis?: string }): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function getProjectDetails(projectId: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project details');
  return res.json();
}

export async function addSceneToProject(projectId: number, sceneId: number, sectionId?: number): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/add-scene`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene_id: sceneId, section_id: sectionId })
  });
  if (!res.ok) throw new Error('Failed to add scene to project');
  return res.json();
}

export async function fetchProjectAIRecommendations(projectId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/ai-recommendations`);
  if (!res.ok) throw new Error('Failed to fetch AI recommendations');
  return res.json();
}

export async function exportClips(sceneIds: number[], resolution = 'original', projectId?: number): Promise<any> {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene_ids: sceneIds, resolution, project_id: projectId })
  });
  if (!res.ok) throw new Error('Failed to export clips');
  return res.json();
}

export async function importSubtitles(episodeId: number, filepath: string): Promise<any> {
  const res = await fetch(`${API_BASE}/subtitles/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ episode_id: episodeId, filepath })
  });
  if (!res.ok) throw new Error('Failed to import subtitles');
  return res.json();
}
