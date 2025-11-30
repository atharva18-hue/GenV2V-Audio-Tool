# 🎬 V2V & Audio Tool

A full-stack AI video processing pipeline designed to bring high-fidelity Anime Style Transfer to consumer hardware (4GB VRAM).

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Tech Stack](https://img.shields.io/badge/Stack-React_Flask_Redis_PyTorch-blue)
![GPU Support](https://img.shields.io/badge/GPU-NVIDIA_GTX_1650_Optimized-green)

## 💡 Key Features

### 1. Hybrid AI Video Pipeline
- **Smart Hardware Adaptation:** Runs optimized `AnimeGANv2` inference locally on low-VRAM GPUs (GTX 1650 4GB).
- **Custom "Titan" Filter:** Uses OpenCV edge detection and color grading to force high-contrast, "Demon Slayer" style aesthetics that standard GANs miss.
- **Smoothing Algorithms:** Custom temporal smoothing script to reduce flicker between AI-generated frames.

### 2. Audio Engineering Tool
- **Real-time Processing:** Uses the Web Audio API to process audio files instantly in the browser.
- **Effects:** Pitch shifting (Kid/Cat modes), High-Shelf EQ, and Speed control.
- **WAV Export:** Renders processed audio to high-quality WAV files client-side.

### 3. Enterprise-Grade Backend
- **Redis Job Queue:** Manages asynchronous video processing jobs.
- **Auto-Vanish System:** A background "Reaper" worker automatically expires and deletes processed videos after 30 minutes to manage server storage.
- **Flask API:** RESTful endpoints for file upload, status polling, and streaming responses.

### 4. Modern Frontend
- **Glassmorphism UI:** Built with React + Tailwind CSS + Framer Motion.
- **Real-time Polling:** WebSocket-style status updates for long-running GPU tasks.

---

## 🛠️ Architecture

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React (Vite) | Interactive UI with drag-and-drop & audio visualization. |
| **Backend** | Flask (Python) | API server that orchestrates the AI pipeline. |
| **Database** | Redis | In-memory job tracking and TTL (Time-To-Live) management. |
| **AI Engine** | PyTorch | Running quantized AnimeGANv2 models. |
| **Video Ops** | FFmpeg | Frame extraction, resizing, and audio merging. |

---

## 🚀 Installation

### Prerequisites
- Python 3.10+
- Node.js & npm
- Redis Server (Must be running)
- NVIDIA GPU (Recommended)

### 1. Clone the Repository
```bash
git clone [https://github.com/YashKapri/V2V-and-Audio-Tool.git](https://github.com/YashKapri/V2V-and-Audio-Tool.git)
cd V2V-and-Audio-Tool
