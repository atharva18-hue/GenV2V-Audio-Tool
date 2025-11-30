# backend/app.py
import os
import uuid
import shutil
import threading
import subprocess
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import sys 
from werkzeug.utils import secure_filename

# ---------- Configuration ----------
ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / "scripts"
UPLOADS_DIR = ROOT / "backend_uploads"
RESULTS_DIR = ROOT / "backend_results"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXT = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".ogg"}
JOBS = {}
app = Flask(__name__)
CORS(app)

def allowed_file(filename):
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXT

def safe_filename(fname):
    return secure_filename(fname)

def update_job(job_id, **kwargs):
    job = JOBS.setdefault(job_id, {})
    job.update(kwargs)

def pipeline_worker(job_id, input_path, style, resolution):
    try:
        update_job(job_id, status="running", progress=1, message="Starting pipeline")
        outdir = RESULTS_DIR / f"{job_id}"
        outdir.mkdir(parents=True, exist_ok=True)

        # 1. Extract
        update_job(job_id, progress=10, message="Extracting frames")
        frames_dir = outdir / "frames"
        frames_dir.mkdir(exist_ok=True)
        subprocess.check_call([sys.executable, str(SCRIPTS_DIR / "extract_frames.py"), "--video", str(input_path), "--out", str(frames_dir)])

        # 2. Resize
        update_job(job_id, progress=25, message="Resizing frames")
        frames_resized = outdir / "frames_resized"
        w, h = (1920, 1080) if resolution == "1080" else (1280, 720)
        subprocess.check_call([sys.executable, str(SCRIPTS_DIR / "resize_frames.py"), "--in_dir", str(frames_dir), "--out_dir", str(frames_resized), "--width", str(w), "--height", str(h)])

        # 3. Stylize (Fixed Arguments)
        update_job(job_id, progress=40, message="Applying Anime Style")
        styled_dir = outdir / "styled"
        styled_dir.mkdir(exist_ok=True)
        # We pass the style selected in the UI
        subprocess.check_call([
            sys.executable, str(SCRIPTS_DIR / "apply_animegan.py"), 
            "--frames", str(frames_resized), 
            "--out", str(styled_dir), 
            "--pretrained", style
        ])

        # 4. Smooth (Bypass)
        update_job(job_id, progress=80, message="Finalizing frames")
        smooth_dir = outdir / "smoothed"
        smooth_dir.mkdir(exist_ok=True)
        subprocess.check_call([
            sys.executable, str(SCRIPTS_DIR / "temporal_smooth.py"), 
            "--styled", str(styled_dir), 
            "--out", str(smooth_dir)
        ])

        # 5. Reassemble
        update_job(job_id, progress=90, message="Creating video")
        final_video = outdir / f"{job_id}_final_anime.mp4"
        subprocess.check_call([sys.executable, str(SCRIPTS_DIR / "reassemble.py"), "--frames", str(smooth_dir), "--out", str(final_video), "--fps", "30", "--audio", str(input_path)])

        # Finish
        result_path = RESULTS_DIR / f"{job_id}_final_anime.mp4"
        shutil.copyfile(final_video, result_path)
        update_job(job_id, status="done", progress=100, message="Completed", result=str(result_path))

    except Exception as e:
        print(f"Job failed: {e}")
        update_job(job_id, status="error", message=f"Error: {e}", progress=0)

@app.route("/api/convert", methods=["POST"])
def api_convert():
    if "file" not in request.files: return jsonify({"error": "No file"}), 400
    f = request.files["file"]
    if f.filename == "": return jsonify({"error": "Empty filename"}), 400
    if not allowed_file(f.filename): return jsonify({"error": "Unsupported file type"}), 400

    style = request.form.get("style", "face_paint_512_v2")
    resolution = request.form.get("resolution", "720")
    job_id = uuid.uuid4().hex
    filename = f"{job_id}_{safe_filename(f.filename)}"
    save_path = UPLOADS_DIR / filename
    f.save(save_path)
    
    JOBS[job_id] = {"status": "queued", "progress": 0, "message": "Queued", "result": None}
    
    threading.Thread(target=pipeline_worker, args=(job_id, save_path, style, resolution), daemon=True).start()
    return jsonify({"jobId": job_id})

@app.route("/api/status/<job_id>", methods=["GET"])
def api_status(job_id):
    return jsonify(JOBS.get(job_id) or {"error": "Not found"})

@app.route("/api/result/<job_id>", methods=["GET"])
def api_result(job_id):
    job = JOBS.get(job_id)
    if not job: return jsonify({"error": "Job not found"}), 404
    if job.get("status") != "done": return jsonify({"error": "Result not ready", "status": job.get("status")}), 409
    
    result_path = Path(job.get("result"))
    if not result_path.exists(): return jsonify({"error": "Result file missing"}), 500
    
    return jsonify({"downloadUrl": f"/download/{result_path.name}"})

@app.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    path = RESULTS_DIR / filename
    if not path.exists(): abort(404)
    return send_from_directory(RESULTS_DIR, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860, debug=True, threaded=True)