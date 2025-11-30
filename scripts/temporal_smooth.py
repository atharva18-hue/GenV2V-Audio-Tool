# scripts/temporal_smooth.py
import shutil
import sys
import argparse
from pathlib import Path

def smooth(styled_dir, out_dir):
    # Fix: Convert string arguments to Path objects to avoid 'AttributeError'
    styled_dir = Path(styled_dir)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[INFO] Bypassing smoothing. Copying frames from {styled_dir}...", file=sys.stderr)
    
    files = sorted(styled_dir.glob('frame_*.png'))
    if not files:
        print("[WARN] No frames found to copy!", file=sys.stderr)
        return

    for f in files:
        # Copy file directly (No mixing with original)
        shutil.copy(f, out_dir / f.name)

    print(f"[DONE] Copied {len(files)} frames.", file=sys.stderr)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    # Accept all args to prevent crashes, but ignore 'orig' and 'alpha'
    p.add_argument('--orig', default=None)
    p.add_argument('--styled', required=True)
    p.add_argument('--out', required=True)
    p.add_argument('--alpha', default=None)
    
    args = p.parse_args()
    smooth(args.styled, args.out)