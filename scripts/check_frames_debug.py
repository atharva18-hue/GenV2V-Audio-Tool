# scripts/check_frames_debug.py
import cv2, numpy as np, sys
from pathlib import Path

job = sys.argv[1] if len(sys.argv)>1 else r"G:\Project\v2v\backend_results\37ccf200d32f4bc1bc095005cf7c3a53"
orig_dir = Path(job) / "frames_resized"
styled_dir = Path(job) / "styled"
smoothed_dir = Path(job) / "smoothed"
out_debug = Path(job) / "debug_checks"
out_debug.mkdir(parents=True, exist_ok=True)

def info(p):
    if not p.exists(): 
        print(f" MISSING: {p}")
        return None
    img = cv2.imread(str(p), cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f" COULD NOT READ: {p}")
        return None
    print(f"{p.name}: shape={img.shape} dtype={img.dtype} min={img.min()} max={img.max()} size={p.stat().st_size} bytes")
    return img

# choose first few frames to inspect
for i in range(1, 6):
    name = f"frame_{i:06d}.png"
    o = info(orig_dir / name)
    s = info(styled_dir / name)
    m = info(smoothed_dir / name)
    # write a side-by-side debug image if we could read at least one
    if any(x is not None for x in (o,s,m)):
        parts = []
        for x in (o,s,m):
            if x is None:
                parts.append(np.zeros((256,256,3), dtype=np.uint8))  # placeholder
            else:
                # resize for visual comparison
                h,w = x.shape[:2]
                scale = 256 / max(h,w)
                parts.append(cv2.resize(x, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA))
        # make heights equal by padding
        maxh = max(p.shape[0] for p in parts)
        padded = []
        for p in parts:
            padh = maxh - p.shape[0]
            padded.append(cv2.copyMakeBorder(p, 0, padh, 0, 0, cv2.BORDER_CONSTANT, value=(0,0,0)))
        debug = np.concatenate(padded, axis=1)
        cv2.putText(debug, "orig | styled | smoothed", (10,20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1, cv2.LINE_AA)
        cv2.imwrite(str(out_debug / f"debug_{i:02d}.png"), debug)
        print(" Wrote debug image:", out_debug / f"debug_{i:02d}.png")

print("Done. Inspect the printed info and debug images in", out_debug)
