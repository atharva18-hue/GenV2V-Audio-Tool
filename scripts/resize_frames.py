# resize_frames.py
import cv2
from pathlib import Path

def resize_frames(in_dir, out_dir, width, height):
    in_dir = Path(in_dir)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for img_path in sorted(in_dir.glob("frame_*.png")):
        img = cv2.imread(str(img_path))
        if img is None:
            continue

        resized = cv2.resize(img, (int(width), int(height)), interpolation=cv2.INTER_LANCZOS4)
        out_path = out_dir / img_path.name
        cv2.imwrite(str(out_path), resized)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--in_dir", required=True)
    parser.add_argument("--out_dir", required=True)
    parser.add_argument("--width", required=True)
    parser.add_argument("--height", required=True)

    args = parser.parse_args()
    resize_frames(args.in_dir, args.out_dir, args.width, args.height)
