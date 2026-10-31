import React from 'react';
import { Play, Star, Scissors, Download, Tag, Users } from 'lucide-react';
import { Scene } from '../types';

interface SceneCardProps {
  scene: Scene;
  onPreview: (scene: Scene) => void;
  onAddToProject?: (scene: Scene) => void;
  onExport?: (scene: Scene) => void;
  onToggleFavorite?: (scene: Scene) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  onPreview,
  onAddToProject,
  onExport,
  onToggleFavorite
}) => {
  const thumbUrl = scene.thumbnail_path || '/placeholder.jpg';

  const parseTags = (str?: string) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const moods = parseTags(scene.mood_tags);
  const actions = parseTags(scene.action_tags);
  const users = parseTags(scene.user_tags);
  const allTags = [...moods, ...actions, ...users].slice(0, 4);

  return (
    <div className="bg-[#131b2e] border border-slate-800/80 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 hover:shadow-purple-500/10 hover:-translate-y-1 flex flex-col justify-between group">
      
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onPreview(scene)}>
        <img
          src={thumbUrl}
          alt={scene.description || 'Scene'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback placeholder gradient if image loading
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        
        {/* Timestamp Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm border border-slate-700/80 px-2 py-0.5 rounded text-[11px] font-mono text-purple-300 font-semibold">
          {scene.start_timestamp} → {scene.end_timestamp}
        </div>

        {/* Anime & Episode Badge */}
        <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 font-bold uppercase tracking-wide">
          S{scene.season_num} E{scene.episode_num} • #{scene.scene_number}
        </div>

        {/* Play Overlay Button */}
        <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-white ml-1" />
          </div>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider truncate">
              {scene.anime_title || 'Unknown Anime'}
            </h3>
            {scene.is_favorite && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            )}
          </div>

          <p className="text-xs text-slate-300 font-medium line-clamp-2 mt-1 min-h-[32px]">
            {scene.description || `Scene ${scene.scene_number} in episode`}
          </p>

          {/* Character Badges */}
          {scene.characters && scene.characters.length > 0 && (
            <div className="mt-2 flex items-center space-x-1 overflow-x-auto py-0.5">
              <Users className="w-3 h-3 text-cyan-400 shrink-0" />
              {scene.characters.map((c, i) => (
                <span key={i} className="text-[10px] bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {allTags.map((tag, idx) => (
                <span key={idx} className="text-[10px] bg-purple-950/40 border border-purple-800/40 text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => onPreview(scene)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            <Play className="w-3.5 h-3.5 fill-slate-200" />
            <span>Preview</span>
          </button>

          <div className="flex items-center space-x-1">
            {onAddToProject && (
              <button
                onClick={() => onAddToProject(scene)}
                className="p-1.5 bg-slate-800 hover:bg-purple-900/60 text-slate-300 hover:text-purple-300 border border-slate-700 rounded-lg transition"
                title="Add to AMV Project"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>
            )}

            {onExport && (
              <button
                onClick={() => onExport(scene)}
                className="p-1.5 bg-slate-800 hover:bg-pink-900/60 text-slate-300 hover:text-pink-300 border border-slate-700 rounded-lg transition"
                title="Export Clip"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
