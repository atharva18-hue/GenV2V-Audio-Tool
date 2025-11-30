# reassemble.py
import subprocess
from pathlib import Path
import argparse

def reassemble(frames_dir, out_video, fps=30, audio_src=None):
    # This block is now indented with 4 spaces
    frames_dir = Path(frames_dir)
    cmd = [
        'ffmpeg',
        '-y',
        '-framerate', str(fps),
        '-i', str(frames_dir / 'frame_%06d.png')
    ]

    if audio_src:
        cmd += [
            '-i', audio_src, 
            '-c:v', 'libx264', 
            '-pix_fmt', 'yuv420p', 
            '-c:a', 'aac', 
            '-shortest', 
            out_video
        ]
    else:
        cmd += [
            '-c:v', 'libx264', 
            '-pix_fmt', 'yuv420p', 
            out_video
        ]
        
    subprocess.check_call(cmd)

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--frames', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--fps', type=int, default=30)
    p.add_argument('--audio', default=None)
    args = p.parse_args()
    reassemble(args.frames, args.out, args.fps, args.audio)