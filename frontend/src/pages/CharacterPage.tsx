import React, { useState, useEffect } from 'react';
import { Users, Plus, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { listCharacters, createCharacter, fetchAnimeList } from '../api';
import { Character, Anime } from '../types';

export const CharacterPage: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [animeId, setAnimeId] = useState<number | undefined>();

  const loadData = async () => {
    try {
      const [chars, animes] = await Promise.all([listCharacters(), fetchAnimeList()]);
      setCharacters(chars);
      setAnimeList(animes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCharacter(name.trim(), animeId, description || undefined);
      setName('');
      setDescription('');
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Character Profiles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage character profiles and reference images for visual identification</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Character Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map(char => (
          <div key={char.id} className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-purple-400">
                  {char.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{char.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Profile ID: #{char.id}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {char.description || 'No description added.'}
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{char.ref_images?.length || 0} Reference Images</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Create Character Profile</h2>
            
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Character Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Joseph Joestar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Anime Series</label>
                <select
                  value={animeId || ''}
                  onChange={(e) => setAnimeId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="">Unassigned</option>
                  {animeList.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about character visual features..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
