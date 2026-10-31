import os
import re
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from backend.app.database import init_db
from backend.app.routers import (
    anime, episode, scene, search, subtitle, character, project, export
)

app = FastAPI(
    title="Anime Scene Finder API",
    description="Local-first AI-powered AMV scene finder engine",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    os.makedirs("data/thumbnails", exist_ok=True)
    os.makedirs("data/exports", exist_ok=True)
    os.makedirs("data/uploads", exist_ok=True)
    init_db()

# Serve static thumbnails
app.mount("/thumbnails", StaticFiles(directory="data/thumbnails"), name="thumbnails")

# Router Registrations
app.include_router(anime.router)
app.include_router(episode.router)
app.include_router(scene.router)
app.include_router(search.router)
app.include_router(subtitle.router)
app.include_router(character.router)
app.include_router(project.router)
app.include_router(export.router)

# Video Stream endpoint with HTTP 206 Range Request support
@app.get("/api/stream")
def stream_video(path: str, request: Request):
    """
    Streams local video files with HTTP Range Request (206 Partial Content) support,
    allowing smooth scrubbing and instant timestamp seeking in the web player.
    """
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

    file_size = os.path.getsize(path)
    range_header = request.headers.get("range")

    if not range_header:
        def iterfile():
            with open(path, mode="rb") as f:
                yield from f
        return StreamingResponse(
            iterfile(),
            media_type="video/mp4",
            headers={"Content-Length": str(file_size), "Accept-Ranges": "bytes"}
        )

    # Parse Range: bytes=start-end
    match = re.search(r"bytes=(\d+)-(\d+)?", range_header)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid Range Header")

    start = int(match.group(1))
    end = int(match.group(2)) if match.group(2) else file_size - 1
    end = min(end, file_size - 1)
    chunk_size = (end - start) + 1

    def stream_bytes():
        with open(path, mode="rb") as f:
            f.seek(start)
            bytes_read = 0
            while bytes_read < chunk_size:
                buffer_size = min(1024 * 1024, chunk_size - bytes_read)
                data = f.read(buffer_size)
                if not data:
                    break
                bytes_read += len(data)
                yield data

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_size),
    }

    return Response(
        content=bytes(b"".join(stream_bytes())),
        status_code=206,
        headers=headers,
        media_type="video/mp4"
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Anime Scene Finder API"}
