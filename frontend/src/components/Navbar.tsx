import React from 'react';
import { Play, Film, Search, Users, FolderHeart, Music, Download, Settings, Sparkles, Cpu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  quickStats?: { animeCount: number; sceneCount: number };
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, quickStats }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'library', label: 'Library', icon: Film },
    { id: 'search', label: 'Scene Search', icon: Search },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'collections', label: 'Collections', icon: FolderHeart },
    { id: 'projects', label: 'AMV Projects', icon: Music },
    { id: 'export', label: 'Clip Export', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0d1322]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
            ANIME SCENE FINDER
          </h1>
          <p className="text-[10px] text-purple-400/80 font-mono uppercase tracking-wider">
            Local AMV Engine • Privacy First
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center space-x-1 bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="flex items-center space-x-3">
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Engine: <strong className="text-emerald-400">READY</strong></span>
        </div>
        {quickStats && (
          <div className="text-xs text-slate-400 font-mono bg-purple-950/40 border border-purple-800/40 px-3 py-1.5 rounded-lg">
            <span className="text-purple-300 font-semibold">{quickStats.sceneCount}</span> Scenes Indexed
          </div>
        )}
      </div>
    </header>
  );
};
