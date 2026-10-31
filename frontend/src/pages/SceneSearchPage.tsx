import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, Smile, Flame, Users, Tag, RefreshCw } from 'lucide-react';
import { searchScenes, fetchAnimeList, listCharacters } from '../api';
import { Scene, Anime, Character, SearchFilters } from '../types';
import { SceneCard } from '../components/SceneCard';

interface SceneSearchPageProps {
  initialQuery?: string;
  initialEpisodeId?: number;
  onPreviewScene: (scene: Scene) => void;
}

export const SceneSearchPage: React.FC<SceneSearchPageProps> = ({
  initialQuery = '',
  initialEpisodeId,
  onPreviewScene
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [selectedAnime, setSelectedAnime] = useState<string>('All');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('All');
  const [selectedMood, setSelectedMood] = useState<string>('All');
  const [selectedAction, setSelectedAction] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('');

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [characterList, setCharacterList] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const moodsList = ['All', 'Happy', 'Sad', 'Angry', 'Lonely', 'Excited', 'Afraid', 'Calm', 'Confident', 'Emotional'];
  const actionsList = ['All', 'Fighting', 'Walking', 'Running', 'Talking', 'Laughing', 'Crying', 'Dancing', 'Training', 'Sleeping', 'Eating'];

  useEffect(() => {
    async function loadFilters() {
      try {
        const [animes, chars] = await Promise.all([fetchAnimeList(), listCharacters()]);
        setAnimeList(animes);
        setCharacterList(chars);
      } catch (err) {
        console.error(err);
      }
    }
    loadFilters();
  }, []);

  const performSearch = async () => {
    setLoading(true);
    try {
      const filters: SearchFilters = {
        q: query || undefined,
        anime: selectedAnime !== 'All' ? selectedAnime : undefined,
        character: selectedCharacter !== 'All' ? selectedCharacter : undefined,
        mood: selectedMood !== 'All' ? selectedMood : undefined,
        action: selectedAction !== 'All' ? selectedAction : undefined,
        tag: tagFilter || undefined,
        episode_id: initialEpisodeId || undefined
      };
      const results = await searchScenes(filters);
      setScenes(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [query, selectedAnime, selectedCharacter, selectedMood, selectedAction, tagFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <Search className="w-6 h-6 text-purple-400" />
            <span>AI Scene Search</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search anime moments using natural language, subtitles, visual descriptions, character detections & tags.
          </p>
        </div>

        {/* Natural Language Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library... e.g. 'Joseph funny moments', 'Chika dancing', 'Zoro training'"
            className="w-full bg-[#131b2e] border-2 border-purple-900/60 focus:border-purple-500 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 focus:outline-none shadow-xl pr-12 font-medium"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-xl text-white">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Drawers */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-purple-400" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Anime Filter */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Anime</label>
            <select
              value={selectedAnime}
              onChange={(e) => setSelectedAnime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Anime</option>
              {animeList.map(a => (
                <option key={a.id} value={a.title}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Character Filter */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Character</label>
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Characters</option>
              {characterList.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Mood Filter */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Mood / Emotion</label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
            >
              {moodsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Action</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
            >
              {actionsList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Custom Tag */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Tag Filter</label>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="e.g. friendship"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">
          Showing <strong className="text-purple-400">{scenes.length}</strong> scene results
        </span>
      </div>

      {/* Scene Results Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono">Searching scenes...</div>
      ) : scenes.length === 0 ? (
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">No Matching Scenes Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or clear filters to view more scenes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {scenes.map(sc => (
            <SceneCard
              key={sc.id}
              scene={sc}
              onPreview={onPreviewScene}
            />
          ))}
        </div>
      )}

    </div>
  );
};
