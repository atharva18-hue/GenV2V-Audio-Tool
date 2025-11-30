#  GenV2V - Voice-to-Video Audio Tool

A full-stack AI video processing pipeline designed to bring high-fidelity Anime Style Transfer to consumer hardware (4GB VRAM).

---

##  Key Features

### 1. Hybrid AI Video Pipeline
- **Smart Hardware Adaptation:** Runs optimized `AnimeGANv2` inference locally on low-VRAM GPUs (GTX 1650 4GB).
- **Custom "Titan" Filter:** Uses OpenCV edge detection and color grading to create high-contrast, "Demon Slayer"-style aesthetics.
- **Smoothing Algorithms:** Temporal smoothing script reduces flicker between AI-generated frames.

### 2. Audio Engineering Tool
- **Real-time Processing:** Uses the Web Audio API to process audio instantly in the browser.
- **Effects:** Pitch shifting (Kid/Cat modes), High-Shelf EQ, and Speed control.
- **WAV Export:** Renders processed audio to high-quality WAV files client-side.

### 3. Enterprise-Grade Backend
- **Redis Job Queue:** Manages asynchronous video processing jobs efficiently.
- **Auto-Vanish System:** Background "Reaper" worker deletes processed videos after 30 minutes to manage storage.
- **Flask API:** RESTful endpoints for file upload, status polling, and streaming responses.

### 4. Modern Frontend
- **Glassmorphism UI:** Built with React + Tailwind CSS + Framer Motion.
- **Real-time Polling:** WebSocket-style status updates for long-running GPU tasks.

---

##  Architecture

| Component       | Technology        | Description                                         |
|-----------------|-----------------|-----------------------------------------------------|
| **Frontend**     | React (Vite)     | Interactive UI with drag-and-drop & audio visualization. |
| **Backend**      | Flask (Python)   | API server that orchestrates the AI pipeline.      |
| **Database**     | Redis            | In-memory job tracking and TTL (Time-To-Live) management. |
| **AI Engine**    | PyTorch          | Running quantized AnimeGANv2 models.              |
| **Video Ops**    | FFmpeg           | Frame extraction, resizing, and audio merging.    |

---

##  Installation

### Prerequisites
- Python 3.10+
- Node.js & npm
- Redis Server (must be running)
- NVIDIA GPU (Recommended, e.g., GTX 1650 4GB)
- FFmpeg installed and added to PATH

### Steps

1. **Clone the repository**
```
# 1. Clone the repository
git clone https://github.com/atharva18-hue/GenV2V.git
cd GenV2V

# 2. Install backend dependencies
pip install -r requirements.txt
pip install torch==2.6.0+cu118 torchvision==0.15.1+cu118 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu118

# 3. Install frontend dependencies
cd anime-frontend
npm install

# 4. Start Redis server (in a separate terminal)
redis-server

# 5. Run Backend (in another terminal)
cd ..
python backend/app.py

# 6. Run Frontend (in another terminal)
cd anime-frontend
npm run dev

# 7. Open Frontend in browser (usually http://localhost:5173/)
#    Upload video, select AI filter, apply audio effects, download result


