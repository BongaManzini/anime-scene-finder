import React, { useState } from 'react';
import { Download, Folder, CheckCircle2, AlertCircle } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const [resolution, setResolution] = useState<string>('1080p');
  const [outputDir, setOutputDir] = useState<string>('data/exports');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
          <Download className="w-6 h-6 text-purple-400" />
          <span>Batch Clip Exporter</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Export trimmed MP4 clips via local FFmpeg hardware pipeline</p>
      </div>

      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Target Resolution</label>
            <div className="grid grid-cols-3 gap-3">
              {['original', '1080p', '720p'].map(res => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-3 rounded-xl text-xs font-mono font-bold uppercase border transition ${
                    resolution === res
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {res === 'original' ? 'Original Aspect' : res}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Output Folder Path</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span>FFmpeg Mode: <strong className="text-purple-400">libx264 (CRF 18 / AAC)</strong></span>
            <span className="text-emerald-400 font-bold">Local Engine Ready</span>
          </div>
          <p>Exported clips are automatically organized into clean folder structures: <br/><code>[Project Name] / Clips / [Section] / [Clip_001.mp4]</code></p>
        </div>
      </div>
    </div>
  );
};
