import React, { useState } from 'react';
import { X, FolderPlus, FileVideo, Sparkles } from 'lucide-react';
import { importEpisodes } from '../api';

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImportSuccess }) => {
  const [pathsInput, setPathsInput] = useState<string>('');
  const [animeTitle, setAnimeTitle] = useState<string>('');
  const [seasonNum, setSeasonNum] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filepaths = pathsInput.split('\n').map(p => p.trim()).filter(Boolean);
    if (filepaths.length === 0) {
      setErrorMsg('Please enter at least one local video file path.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await importEpisodes(filepaths, animeTitle || undefined, seasonNum);
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-700/50 text-purple-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Local Anime Videos</h2>
              <p className="text-xs text-slate-400">No piracy, no external downloading • Local files only</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
              <span>Local File Paths (One per line)</span>
              <span className="text-slate-500 font-mono">MP4, MKV, AVI, MOV, WEBM</span>
            </label>
            <textarea
              value={pathsInput}
              onChange={(e) => setPathsInput(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              placeholder="/home/user/Videos/JoJo/JoJo_S02E12.mp4&#10;/home/user/Videos/JoJo/JoJo_S02E13.mp4"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-300 font-semibold block mb-1">Anime Title (Optional Override)</label>
              <input
                type="text"
                value={animeTitle}
                onChange={(e) => setAnimeTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder="e.g. JoJo's Bizarre Adventure"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Season #</label>
              <input
                type="number"
                value={seasonNum}
                onChange={(e) => setSeasonNum(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Extracting Metadata...' : 'Import Videos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
