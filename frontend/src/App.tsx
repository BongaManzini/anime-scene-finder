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
