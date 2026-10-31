import React, { useState, useEffect } from 'react';
import { Music, Plus, Sparkles, Scissors, Layers, Film, Play, Download, Trash2, ArrowRight, Bot, CheckCircle } from 'lucide-react';
import { listProjects, createProject, getProjectDetails, exportClips, fetchProjectAIRecommendations, addSceneToProject } from '../api';
import { Project, ProjectSection, Scene } from '../types';

interface AMVProjectPageProps {
  onPreviewScene: (scene: Scene) => void;
}

export const AMVProjectPage: React.FC<AMVProjectPageProps> = ({ onPreviewScene }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [aiRecommendations, setAiRecommendations] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('September - Joseph Joestar');
  const [animeTitle, setAnimeTitle] = useState<string>("JoJo's Bizarre Adventure");
  const [characterName, setCharacterName] = useState<string>('Joseph Joestar');
  const [songTitle, setSongTitle] = useState<string>('September - Earth, Wind & Fire');
  const [thesis, setThesis] = useState<string>("Analyze why Joseph Joestar is one of anime's most entertaining characters.");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        loadDetails(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDetails = async (id: number) => {
    try {
      const details = await getProjectDetails(id);
      setActiveProject(details);
      setAiRecommendations(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchAi = async () => {
    if (!activeProject) return;
    setLoadingAi(true);
    try {
      const recs = await fetchProjectAIRecommendations(activeProject.id);
      setAiRecommendations(recs.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAddRecToSection = async (sceneId: number, sectionId: number) => {
    if (!activeProject) return;
    try {
      await addSceneToProject(activeProject.id, sceneId, sectionId);
      loadDetails(activeProject.id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProj = await createProject({
        name,
        anime_title: animeTitle,
        character_name: characterName,
        song_title: songTitle,
        thesis
      });
      setShowNewModal(false);
      loadProjects();
      loadDetails(newProj.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportProjectClips = async () => {
    if (!activeProject || !activeProject.sections) return;
    const allSceneIds: number[] = [];
    activeProject.sections.forEach(sec => {
      if (sec.scenes) {
        sec.scenes.forEach(sc => allSceneIds.push(sc.scene_id));
      }
    });

    if (allSceneIds.length === 0) {
      setExportStatus('No scenes in project storyboard to export.');
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    setExportStatus('Exporting project storyboard clips via FFmpeg...');
    try {
      const res = await exportClips(allSceneIds, '1080p', activeProject.id);
      setExportStatus(`Exported ${res.count} clips to data/exports/${activeProject.name}`);
      setTimeout(() => setExportStatus(null), 5000);
    } catch (err: any) {
      setExportStatus(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
            <Music className="w-6 h-6 text-purple-400" />
            <span>AMV Storyboard & Project Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Organize scenes into song sections, structure video thesis, and batch export clips</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New AMV Project</span>
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="p-3 bg-purple-950/60 border border-purple-800 text-xs text-purple-200 rounded-xl font-mono">
          {exportStatus}
        </div>
      )}

      {/* Project Selector Bar */}
      {projects.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => loadDetails(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
                activeProject?.id === p.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-[#131b2e] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {activeProject ? (
        <div className="space-y-6">
          
          {/* Project Thesis & Song Details */}
          <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">
                  {activeProject.anime_title} • Character: {activeProject.character_name}
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">{activeProject.name}</h2>
              </div>

              <button
                onClick={handleExportProjectClips}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export All Storyboard Clips</span>
              </button>
            </div>

            {/* Song Waveform Mockup */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-2">
                  <Music className="w-3.5 h-3.5 text-pink-400" />
                  <strong className="text-slate-200">{activeProject.song_title || 'Audio Song Track'}</strong>
                </span>
                <span>Timeline Length: 03:45</span>
              </div>
              <div className="h-10 bg-slate-900 rounded-lg flex items-center justify-center space-x-1 px-3">
                {[...Array(60)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-purple-500/50 rounded-full"
                    style={{ height: `${Math.sin(i * 0.3) * 40 + 50}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Video Thesis */}
            {activeProject.thesis && (
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-semibold block">Video Goal / Thesis:</span>
                  <p className="text-xs text-slate-300 italic mt-0.5">"{activeProject.thesis}"</p>
                </div>
                <button
                  onClick={handleFetchAi}
                  disabled={loadingAi}
                  className="px-3.5 py-2 bg-purple-900/60 border border-purple-700 hover:bg-purple-800 text-purple-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm shrink-0 ml-4"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>{loadingAi ? 'Analyzing Database...' : 'AI Smart Scene Assistant'}</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Smart Scene Recommendations Panel */}
          {aiRecommendations && (
            <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-700/60 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-white uppercase tracking-wider">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span>AI Smart Scene Recommendations</span>
              </div>
              <p className="text-xs text-slate-300">
                Recommended scenes from your indexed library matched semantically against your project goal and section titles.
              </p>

              <div className="space-y-4">
                {Object.entries(aiRecommendations).map(([secTitle, recs]: [string, any]) => (
                  <div key={secTitle} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-purple-300 font-mono uppercase">{secTitle}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {recs.map((r: any, i: number) => {
                        const secObj = activeProject.sections?.find(s => s.title === secTitle);
                        return (
                          <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 font-semibold">
                              <span>{r.start_timestamp} → {r.end_timestamp}</span>
                              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded">
                                {r.score}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-2">{r.description || 'Matching scene'}</p>
                            {secObj && (
                              <button
                                onClick={() => handleAddRecToSection(r.scene_id, secObj.id)}
                                className="w-full py-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[10px] rounded flex items-center justify-center space-x-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add to {secTitle}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storyboard Section Timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Storyboard Timeline Sections</span>
            </h3>

            <div className="space-y-4">
              {activeProject.sections?.map(sec => (
                <div key={sec.id} className="bg-[#131b2e] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      {sec.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {sec.scenes?.length || 0} Scenes Attached
                    </span>
                  </div>

                  {/* Scenes attached */}
                  {!sec.scenes || sec.scenes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No scenes added to this section yet. Use "Add to Project" from Scene Search to populate this section.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {sec.scenes.map((sc, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                          <img
                            src={sc.thumbnail_path}
                            alt="Scene"
                            className="w-16 h-10 object-cover rounded-lg bg-slate-950"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-purple-400 font-semibold block truncate">
                              {sc.start_timestamp} → {sc.end_timestamp}
                            </span>
                            <p className="text-[11px] text-slate-300 truncate">
                              {sc.description || 'Project Scene'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Create New AMV Project</h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Anime Series</label>
                  <input
                    type="text"
                    value={animeTitle}
                    onChange={(e) => setAnimeTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Main Character</label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Song Title / Artist</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Video Goal / Thesis</label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
