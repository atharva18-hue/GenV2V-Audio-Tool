import subprocess
from pathlib import Path

def extract(video_path, out_dir, fps=None):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(video_path)
    ]

    if fps:
        cmd += ["-r", str(fps)]

    cmd += [str(out_dir / "frame_%06d.png")]

    subprocess.check_call(cmd)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--fps", type=int, default=None)

    args = parser.parse_args()
    extract(args.video, args.out, args.fps)
