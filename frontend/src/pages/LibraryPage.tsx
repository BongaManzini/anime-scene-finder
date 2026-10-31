import React, { useState, useEffect } from 'react';
import { Film, FolderPlus, Play, FileText, CheckCircle2, Clock, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { listEpisodes, analyzeEpisode, importSubtitles } from '../api';
import { Episode, Scene } from '../types';

interface LibraryPageProps {
  onOpenImport: () => void;
  onSelectEpisodeForSearch: (episodeId: number) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onOpenImport,
  onSelectEpisodeForSearch
}) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzingIds, setAnalyzingIds] = useState<number[]>([]);
  const [subImportEpId, setSubImportEpId] = useState<number | null>(null);
  const [subPathInput, setSubPathInput] = useState<string>('');
  const [subMessage, setSubMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await listEpisodes();
      setEpisodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling status
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async (epId: number) => {
    try {
      setAnalyzingIds(prev => [...prev, epId]);
      await analyzeEpisode([epId]);
      setTimeout(loadData, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubImport = async (epId: number) => {
    if (!subPathInput.trim()) return;
    try {
      const res = await importSubtitles(epId, subPathInput.trim());
      setSubMessage(`Successfully indexed ${res.imported_count} subtitle entries!`);
      setSubPathInput('');
      setSubImportEpId(null);
      setTimeout(() => setSubMessage(null), 4000);
      loadData();
    } catch (err: any) {
      setSubMessage(`Subtitle import error: ${err.message}`);
    }
  };

  // Group by Anime
  const groupedAnime = episodes.reduce((acc, ep) => {
    const title = ep.anime_title || 'Unassigned Anime';
    if (!acc[title]) acc[title] = [];
    acc[title].push(ep);
    return acc;
  }, {} as Record<string, Episode[]>);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <Film className="w-6 h-6 text-purple-400" />
            <span>Local Anime Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Organize imported episodes and execute PySceneDetect scene detection</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenImport}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Import Local Video</span>
          </button>
        </div>
      </div>

      {subMessage && (
        <div className="p-3 bg-purple-950/60 border border-purple-800 text-xs text-purple-200 rounded-xl font-mono">
          {subMessage}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono">Loading library...</div>
      ) : Object.keys(groupedAnime).length === 0 ? (
        <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">Your Anime Library is Empty</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Import local video files (MP4, MKV, AVI, MOV, WEBM) to start building your searchable scene index.
          </p>
          <button
            onClick={onOpenImport}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-xl shadow-lg"
          >
            Import Video Files
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAnime).map(([animeTitle, eps]) => (
            <div key={animeTitle} className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-purple-400">
                    {animeTitle[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{animeTitle}</h2>
                    <span className="text-xs text-slate-400 font-mono">{eps.length} Episodes</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eps.map(ep => {
                  const isAnalyzing = ep.status === 'analyzing' || analyzingIds.includes(ep.id);
                  return (
                    <div key={ep.id} className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                          <span>S{ep.season_num} E{ep.episode_num}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            ep.status === 'ready' ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' :
                            isAnalyzing ? 'bg-amber-950 border border-amber-800 text-amber-400 animate-pulse' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {isAnalyzing ? 'Analyzing...' : ep.status}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-200 truncate" title={ep.filename}>
                          {ep.filename}
                        </h3>

                        <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-400 font-mono">
                          <span>Duration: {ep.duration}s</span>
                          <span>Res: {ep.resolution}</span>
                          <span>FPS: {ep.fps}</span>
                          <span>Scenes: <strong className="text-purple-400">{ep.scene_count || 0}</strong></span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleAnalyze(ep.id)}
                          disabled={isAnalyzing}
                          className="flex-1 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50 flex items-center justify-center space-x-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>ANALYZE</span>
                        </button>

                        <button
                          onClick={() => setSubImportEpId(subImportEpId === ep.id ? null : ep.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                          title="Import SRT/ASS Subtitles"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {ep.scene_count && ep.scene_count > 0 ? (
                          <button
                            onClick={() => onSelectEpisodeForSearch(ep.id)}
                            className="p-1.5 bg-purple-950/60 border border-purple-800 text-purple-300 hover:bg-purple-900/60 rounded-lg text-xs font-mono"
                            title="View Scenes"
                          >
                            View
                          </button>
                        ) : null}
                      </div>

                      {/* Subtitle inline import form */}
                      {subImportEpId === ep.id && (
                        <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                          <label className="text-[10px] text-slate-400 font-mono block">Path to SRT/ASS/VTT Subtitle File:</label>
                          <input
                            type="text"
                            value={subPathInput}
                            onChange={(e) => setSubPathInput(e.target.value)}
                            placeholder="/path/to/subs.srt"
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-200 font-mono"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setSubImportEpId(null)}
                              className="px-2 py-0.5 text-[10px] text-slate-400"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubImport(ep.id)}
                              className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-semibold rounded"
                            >
                              Import
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
