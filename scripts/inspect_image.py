# scripts/inspect_image.py
from pathlib import Path
import sys
from PIL import Image
import numpy as np

p = Path(sys.argv[1]) if len(sys.argv)>1 else Path(r"G:\Project\v2v\backend_results\37ccf200d32f4bc1bc095005cf7c3a53\styled\frame_000001.png")
print("File:", p)
print("Exists:", p.exists(), "Size:", p.stat().st_size if p.exists() else "N/A")

try:
    im = Image.open(p)
    im.load()
    arr = np.array(im)
    print("Pillow opened. mode:", im.mode, "size:", im.size, "array shape:", arr.shape, "dtype:", arr.dtype)
    print("min/max:", arr.min(), arr.max())
    # save a debug export
    out = p.parent / "inspect_debug.png"
    im.convert("RGBA").save(out)
    print("Wrote debug copy:", out)
except Exception as e:
    print("Failed to open image with Pillow:", e)
