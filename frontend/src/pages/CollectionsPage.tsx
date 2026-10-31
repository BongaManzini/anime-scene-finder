import React, { useState } from 'react';
import { FolderHeart, Plus, Star, Film } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const [collections] = useState([
    { id: 1, name: 'Joseph Joestar - Funny Moments', count: 14, desc: 'Hilarious reactions and comedic battle scenes' },
    { id: 2, name: 'Caesar & Joseph Friendship', count: 8, desc: 'Friendship scenes and iconic combos' },
    { id: 3, name: 'Chika Fujiwara Iconic Dances', count: 5, desc: 'Dancing and school festival moments' },
    { id: 4, name: 'Epic Climax Battles', count: 22, desc: 'High intensity fight sequences' },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <FolderHeart className="w-6 h-6 text-purple-400" />
            <span>Scene Collections</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Reusable scene playlists across multiple AMV projects</p>
        </div>

        <button className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Collection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(c => (
          <div key={c.id} className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-pink-950 border border-pink-800 flex items-center justify-center text-pink-400">
                  <Star className="w-5 h-5 fill-pink-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{c.count} Saved Scenes</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {c.desc}
            </p>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button className="text-xs text-purple-400 hover:text-purple-300 font-mono font-semibold">
                Open Collection →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
