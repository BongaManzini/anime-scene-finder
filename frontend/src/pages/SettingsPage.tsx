import React, { useState } from 'react';
import { Settings, Cpu, HardDrive, Shield, Zap } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<string>('balanced');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure hardware acceleration, analysis modes, and privacy guarantees</p>
      </div>

      <div className="bg-[#131b2e] border border-slate-800 rounded-2xl p-6 space-y-6">
        
        {/* Hardware Status */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Hardware & Processor Detection</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CPU CORE ENGINE</span>
              <span className="text-slate-200 font-bold">Linux x86_64</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">FFMPEG ACCELERATION</span>
              <span className="text-emerald-400 font-bold">Available (libx264)</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">DATABASE</span>
              <span className="text-purple-400 font-bold">SQLite 3 (WAL Mode)</span>
            </div>
          </div>
        </div>

        {/* Analysis Modes */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-2">Analysis Processing Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'fast', title: 'Fast Mode', desc: 'Lower threshold precision, fast processing on average laptops.' },
              { id: 'balanced', title: 'Balanced Mode (Default)', desc: 'Recommended balance of scene accuracy and speed.' },
              { id: 'high', title: 'High Accuracy Mode', desc: 'Detailed frame inspection and deep scene cut analysis.' },
            ].map(mode => (
              <div
                key={mode.id}
                onClick={() => setAnalysisMode(mode.id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  analysisMode === mode.id
                    ? 'bg-purple-950/50 border-purple-500 text-white'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>{mode.title}</span>
                  {analysisMode === mode.id && <Zap className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1 text-xs text-emerald-200">
          <div className="flex items-center space-x-2 font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Strict Privacy & Legal Compliance</span>
          </div>
          <p className="text-[11px] text-emerald-300/80 leading-relaxed">
            Anime Scene Finder processes all video files completely locally on your device. No video data, subtitles, or media streams are transmitted outside your computer. No DRM bypassing or automated downloading of copyrighted content is performed.
          </p>
        </div>

      </div>
    </div>
  );
};
