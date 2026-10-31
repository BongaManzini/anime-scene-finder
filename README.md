# 🎬 Anime Scene Finder (AI-Powered AMV Scene Finder)

**Anime Scene Finder** is a complete local-first, privacy-focused application for AMV editors. It allows editors to import locally owned anime video episodes, automatically detect visual scene boundaries, index subtitles & dialogue, tag moods and actions, manage character profiles, organize AMV storyboards, and batch export video clips using FFmpeg.

---

## ⚡ Features

- **Local Video Import**: Parse local `MP4`, `MKV`, `AVI`, `MOV`, `WEBM` anime episodes with automatic metadata extraction (resolution, FPS, duration, season/episode detection).
- **PySceneDetect Cut Boundary Analysis**: Detect scene changes (hard cuts, fade transitions) and generate high-quality video frame thumbnails.
- **Natural Language & Subtitle Search**: Search scenes via dialogue, tags, character names, or descriptive queries (e.g. *"Joseph Joestar funny moments"*, *"Chika dancing"*, *"Zoro training"*).
- **Embedded HTML5 Video Player**: Frame-accurate timestamp navigation, keyboard shortcuts (`Space` Play/Pause, `Left`/`Right` ±5s, `J`/`L` ±10s, `I`/`O` Set In/Out Points), and preview controls.
- **Character Profiles & Visual Detection**: Manage character profiles, reference images, and visual recognition confidence scores.
- **AMV Project & Storyboard Workspace**: Connect audio tracks, organize scenes into thesis sections (Intro, Personality, Relationships, Climax, Legacy), and manage timeline flow.
- **FFmpeg Clip Export**: Render single or batch MP4 clips in original, 1080p, or 720p resolution with structured folder output (`Project / Clips / Section / ...`).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **FFmpeg** & `ffprobe` installed on system PATH

### Setup Instructions

#### 1. Linux & macOS
```bash
# Clone or navigate to directory
cd brave-hypatia

# Make launcher executable and run
chmod +x start.sh
./start.sh
```

#### 2. Manual Start (Any OS / Windows)
```bash
# Terminal 1: Backend
python -m venv venv
# On Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser!

---

## 🧪 Testing Phase 1 Functionality

To test Phase 1 features:
1. Open the web app at `http://localhost:3000`.
2. Click **Import Local Video** on the Dashboard or Library page.
3. Provide local video file paths (e.g., sample `.mp4` file).
4. Click **ANALYZE EPISODE** to trigger PySceneDetect scene detection.
5. Search for scenes using the **Scene Search** bar or filter drawers.
6. Click **Preview** on any scene card to open the HTML5 video player modal.
7. Test keyboard shortcuts: `Space` (Play/Pause), `J`/`L` (Seek ±10s), `I`/`O` (Set In/Out points).
8. Add manual mood/action tags and click **Save Tag Changes**.
9. Click **Export Clip** to verify local FFmpeg clip extraction into `data/exports/`.

---

## 🔒 Legal & Privacy
This application is strictly designed for locally stored videos that the user legally owns or has permission to use. It contains no torrenting, piracy, DRM bypassing, or unauthorized streaming features.
