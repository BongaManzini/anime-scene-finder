import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ImportModal } from './components/ImportModal';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { SceneSearchPage } from './pages/SceneSearchPage';
import { CharacterPage } from './pages/CharacterPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { AMVProjectPage } from './pages/AMVProjectPage';
import { ExportPage } from './pages/ExportPage';
import { SettingsPage } from './pages/SettingsPage';
import { Scene } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [previewScene, setPreviewScene] = useState<Scene | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchEpisodeId, setSearchEpisodeId] = useState<number | undefined>();

  const handleSelectSearchQuery = (q: string) => {
    setSearchQuery(q);
    setSearchEpisodeId(undefined);
  };

  const handleSelectEpisodeForSearch = (epId: number) => {
    setSearchEpisodeId(epId);
    setSearchQuery('');
    setActiveTab('search');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onOpenImport={() => setIsImportOpen(true)}
            onPreviewScene={(sc) => setPreviewScene(sc)}
            onSelectSearchQuery={handleSelectSearchQuery}
          />
        )}

        {activeTab === 'library' && (
          <LibraryPage
            onOpenImport={() => setIsImportOpen(true)}
            onSelectEpisodeForSearch={handleSelectEpisodeForSearch}
          />
        )}

        {activeTab === 'search' && (
          <SceneSearchPage
            initialQuery={searchQuery}
            initialEpisodeId={searchEpisodeId}
            onPreviewScene={(sc) => setPreviewScene(sc)}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterPage />
        )}

        {activeTab === 'collections' && (
          <CollectionsPage />
        )}

        {activeTab === 'projects' && (
          <AMVProjectPage onPreviewScene={(sc) => setPreviewScene(sc)} />
        )}

        {activeTab === 'export' && (
          <ExportPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {/* Business First Enterprise Footer */}
      <footer className="py-6 px-8 border-t border-slate-800/80 bg-[#0b0f19] text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-slate-300">&copy; 2026 Anime Scene Finder&trade;</strong> &bull; Perceptual Hashing &amp; Video Scene Segmentation Engine
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Developed by <strong className="text-slate-200">Bonga Manzini</strong></span>
            <span>&bull;</span>
            <a href="https://github.com/BongaManzini/anime-scene-finder" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>

      {/* Video Player Modal */}
      {previewScene && (
        <VideoPlayerModal
          scene={previewScene}
          videoFilePath={previewScene.filename ? undefined : undefined} // stream via scene info
          onClose={() => setPreviewScene(null)}
        />
      )}

      {/* Local Video Importer Modal */}
      {isImportOpen && (
        <ImportModal
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={() => {
            setActiveTab('library');
          }}
        />
      )}
    </div>
  );
};

export default App;
