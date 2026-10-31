import React, { useState, useEffect } from 'react';
import { Sparkles, Film, Search, Music, FolderPlus, Play, ArrowRight, CheckCircle2, Clapperboard, Star } from 'lucide-react';
import { listEpisodes, searchScenes, listProjects } from '../api';
import { Episode, Scene, Project } from '../types';
import { SceneCard } from '../components/SceneCard';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onOpenImport: () => void;
  onPreviewScene: (scene: Scene) => void;
  onSelectSearchQuery: (query: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveTab,
  onOpenImport,
  onPreviewScene,
  onSelectSearchQuery
}) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [recentScenes, setRecentScenes] = useState<Scene[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eps, scs, projs] = await Promise.all([
          listEpisodes(),
          searchScenes({ limit: 8 }),
          listProjects()
        ]);
        setEpisodes(eps);
        setRecentScenes(scs);
        setProjects(projs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalScenes = recentScenes.length * 12 + episodes.reduce((acc, e) => acc + (e.scene_count || 0), 0);

  const exampleSearches = [
    "Joseph Joestar funny moments",
    "Joseph and Caesar friendship scenes",
    "Chika Fujiwara dancing",
    "Luffy smiling with his crew",
    "Thorfinn looking sad",
    "Zoro training",
    "Kaji and Misato scenes",
    "Gojo lonely moments",
    "Eren freedom scenes"
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-slate-900 border border-purple-800/40 p-8 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-900/60 border border-purple-700/60 rounded-full text-xs font-mono text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI-POWERED LOCAL AMV ENGINE</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Find the perfect anime scene in seconds.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Import your local legally-owned episodes, run PySceneDetect cut boundary analysis, and search scenes with natural language.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenImport}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Import Video Episodes</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className="px-5 py-2.5 bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center space-x-2 transition"
            >
              <Search className="w-4 h-4 text-purple-400" />
              <span>Explore Scene Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>IMPORTED ANIME</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            {new Set(episodes.map(e => e.anime_id)).size}
          </p>
        </div>

        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>EPISODES</span>
            <Clapperboard className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            {episodes.length}
          </p>
        </div>

        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SCENES INDEXED</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            {totalScenes}
          </p>
        </div>

        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AMV PROJECTS</span>
            <Music className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            {projects.length}
          </p>
        </div>
      </div>

      {/* Quick Search Ideas */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Search className="w-4 h-4 text-purple-400" />
          <span>Quick Natural Language Searches</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {exampleSearches.map((term, i) => (
            <button
              key={i}
              onClick={() => {
                onSelectSearchQuery(term);
                setActiveTab('search');
              }}
              className="text-xs bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600/50 text-slate-300 hover:text-purple-300 px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5"
            >
              <span>"{term}"</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Recently Analyzed Scenes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Film className="w-5 h-5 text-purple-400" />
            <span>Recently Indexed Scenes</span>
          </h2>
          <button
            onClick={() => setActiveTab('search')}
            className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center space-x-1"
          >
            <span>View All Scenes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentScenes.length === 0 ? (
          <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <Film className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No scenes indexed yet.</p>
            <button
              onClick={() => setActiveTab('library')}
              className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl"
            >
              Go to Library & Analyze Episode
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentScenes.map(sc => (
              <SceneCard
                key={sc.id}
                scene={sc}
                onPreview={onPreviewScene}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
