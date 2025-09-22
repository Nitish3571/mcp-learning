# auto_clip_server.py
import os
import tempfile
import subprocess
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from yt_dlp import YoutubeDL
import uvicorn

app = FastAPI(title="Auto Clip MCP Server")


# FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")

# FFMPEG_BIN = r"C:\ffmpeg\bin\ffmpeg.exe"
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")


# fixed clip durations (in seconds)
CLIP_DURATIONS = [60, 120, 300]  # 1 min, 2 min, 5 min


def run_cmd(cmd: list):
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr)
    return proc.stdout


def download_video(url: str, tmpdir: str) -> str:
    """Download video with yt-dlp, return filepath."""
    opts = {
        "format": "bestvideo+bestaudio/best",
        "outtmpl": os.path.join(tmpdir, "video.%(ext)s"),
        "merge_output_format": "mp4",
        "quiet": True,
    }
    with YoutubeDL(opts) as ydl:
        ydl.extract_info(url, download=True)
    for f in os.listdir(tmpdir):
        if f.startswith("video.") and f.endswith(".mp4"):
            return os.path.join(tmpdir, f)
    raise RuntimeError("Download failed")


def cut_clip(input_file: str, start: int, duration: int, out_file: str):
    cmd = [
        FFMPEG_BIN, "-y",
        "-ss", str(start),
        "-i", input_file,
        "-t", str(duration),
        "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart",
        out_file
    ]
    run_cmd(cmd)


@app.post("/api/autoclips")
def auto_clips(url: str):
    """
    Download video, auto-generate 1, 2, 5 min clips from start.
    """
    tmpdir = tempfile.mkdtemp()
    try:
        video_path = download_video(url, tmpdir)

        responses = []
        for dur in CLIP_DURATIONS:
            out_name = f"clip_{dur//60}min.mp4"
            out_path = os.path.join(tmpdir, out_name)
            cut_clip(video_path, 0, dur, out_path)
            responses.append({
                "clip": f"{dur//60} minute",
                "download_url": f"/api/download?file={out_name}&tmpdir={tmpdir}"
            })

        return {"clips": responses}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download")
def download(file: str, tmpdir: str):
    path = os.path.join(tmpdir, file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=file)

if __name__ == "__main__":
    uvicorn.run("auto_clip_server:app", host="localhost", port=800, reload=False)