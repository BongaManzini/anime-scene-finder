import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Scissors, Plus, Download, Star, Tag, Smile, Flame, Sparkles } from 'lucide-react';
import { Scene } from '../types';
import { updateSceneTags, exportClips, addSceneToProject, listProjects } from '../api';

interface VideoPlayerModalProps {
  scene: Scene;
  videoFilePath?: string;
  onClose: () => void;
  allScenes?: Scene[];
  onSelectScene?: (scene: Scene) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  scene,
  videoFilePath,
  onClose,
  allScenes = [],
  onSelectScene
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(scene.start_time_sec);
  const [inPoint, setInPoint] = useState<number>(scene.start_time_sec);
  const [outPoint, setOutPoint] = useState<number>(scene.end_time_sec);
  const [moodTags, setMoodTags] = useState<string>(scene.mood_tags || '');
  const [actionTags, setActionTags] = useState<string>(scene.action_tags || '');
  const [userTags, setUserTags] = useState<string>(scene.user_tags || '');
  const [description, setDescription] = useState<string>(scene.description || '');
  const [isFavorite, setIsFavorite] = useState<boolean>(scene.is_favorite || false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const videoSrc = `/api/stream?path=${encodeURIComponent(videoFilePath || '')}`;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = scene.start_time_sec;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [scene]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = videoRef.current.currentTime + 5;
          break;
        case 'j':
        case 'J':
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          break;
        case 'l':
        case 'L':
          videoRef.current.currentTime = videoRef.current.currentTime + 10;
          break;
        case 'i':
        case 'I':
          setInPoint(roundTime(videoRef.current.currentTime));
          break;
        case 'o':
        case 'O':
          setOutPoint(roundTime(videoRef.current.currentTime));
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const roundTime = (sec: number) => Math.round(sec * 100) / 100;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSaveTags = async () => {
    setIsSaving(true);
    try {
      await updateSceneTags(scene.id, {
        mood_tags: moodTags,
        action_tags: actionTags,
        user_tags: userTags,
        description,
        is_favorite: isFavorite
      });
      setExportMessage('Tags updated successfully!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportClip = async () => {
    try {
      setExportMessage('Exporting clip via FFmpeg...');
      const res = await exportClips([scene.id]);
      setExportMessage(`Clip exported to: ${res.clips?.[0]?.output_path || 'data/exports'}`);
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      setExportMessage(`Export error: ${err.message}`);
    }
  };

  const currentSceneIndex = allScenes.findIndex(s => s.id === scene.id);
  const prevScene = currentSceneIndex > 0 ? allScenes[currentSceneIndex - 1] : null;
  const nextScene = currentSceneIndex < allScenes.length - 1 ? allScenes[currentSceneIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold">
              {scene.anime_title} • S{scene.season_num} E{scene.episode_num} • Scene #{scene.scene_number}
            </span>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{scene.start_timestamp} → {scene.end_timestamp}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({roundTime(scene.end_time_sec - scene.start_time_sec)}s duration)
              </span>
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg border transition ${
                isFavorite ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Favorite Scene"
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          
          {/* Video Player Main Area */}
          <div className="lg:col-span-2 bg-black flex flex-col justify-between p-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[340px]">
              <video
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain max-h-[55vh]"
                controls
              />
            </div>

            {/* Video Controls & Shortcuts Bar */}
            <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Current: <strong className="text-purple-400">{roundTime(currentTime)}s</strong></span>
                <div className="flex items-center space-x-3">
                  <span className="bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded text-purple-300">
                    IN: {inPoint}s
                  </span>
                  <span className="bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded text-purple-300">
                    OUT: {outPoint}s
                  </span>
                </div>
              </div>

              {/* Action Buttons & Scene Navigation */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    disabled={!prevScene}
                    onClick={() => prevScene && onSelectScene?.(prevScene)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>Prev Scene</span>
                  </button>

                  <button
                    disabled={!nextScene}
                    onClick={() => nextScene && onSelectScene?.(nextScene)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                  >
                    <span>Next Scene</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setInPoint(roundTime(currentTime))}
                    className="px-2.5 py-1.5 bg-purple-900/40 border border-purple-700 text-purple-300 hover:bg-purple-800/50 rounded-lg text-xs font-mono"
                    title="Press 'I' to set In Point"
                  >
                    [I] In
                  </button>
                  <button
                    onClick={() => setOutPoint(roundTime(currentTime))}
                    className="px-2.5 py-1.5 bg-purple-900/40 border border-purple-700 text-purple-300 hover:bg-purple-800/50 rounded-lg text-xs font-mono"
                    title="Press 'O' to set Out Point"
                  >
                    [O] Out
                  </button>

                  <button
                    onClick={handleExportClip}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-semibold shadow-md hover:brightness-110"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Clip</span>
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcut Hints */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>[Space] Play/Pause</span>
                <span>[Left/Right] ±5s</span>
                <span>[J/L] ±10s</span>
                <span>[I] Set In</span>
                <span>[O] Set Out</span>
              </div>
            </div>

            {exportMessage && (
              <div className="mt-2 p-2 bg-purple-900/50 border border-purple-700 rounded-lg text-xs text-purple-200 font-mono">
                {exportMessage}
              </div>
            )}
          </div>

          {/* Right Sidebar: Scene Metadata & Tagging */}
          <div className="p-5 bg-slate-900/40 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>Scene Tags & Metadata</span>
              </h3>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Visual Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="Describe the scene..."
                />
              </div>

              {/* Mood Tags */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1 flex items-center space-x-1">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>Emotions / Moods</span>
                </label>
                <input
                  type="text"
                  value={moodTags}
                  onChange={(e) => setMoodTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Happy, Sad, Funny, Emotional"
                />
              </div>

              {/* Action Tags */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1 flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-pink-400" />
                  <span>Actions</span>
                </label>
                <input
                  type="text"
                  value={actionTags}
                  onChange={(e) => setActionTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Fighting, Dancing, Talking, Walking"
                />
              </div>

              {/* Custom Tags */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Custom Tags</label>
                <input
                  type="text"
                  value={userTags}
                  onChange={(e) => setUserTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. friendship, climax, meme"
                />
              </div>

              {/* Subtitles text index */}
              {scene.subtitles && scene.subtitles.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[11px] text-purple-400 font-mono block font-semibold mb-1">Dialogue / Subtitles:</span>
                  <p className="text-xs text-slate-300 italic">
                    "{scene.subtitles.join(' ')}"
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveTags}
              disabled={isSaving}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition mt-4"
            >
              {isSaving ? 'Saving...' : 'Save Tag Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
