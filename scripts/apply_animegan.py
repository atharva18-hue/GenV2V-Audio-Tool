# scripts/apply_animegan.py
import argparse
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance, ImageOps
import torch
import torchvision.transforms as T
import traceback

def load_generator(pretrained_name, device):
    print(f"[INFO] Loading model: {pretrained_name}", file=sys.stderr)
    try:
        # We force the 'face_paint_512_v2' or 'hayao' model here
        model = torch.hub.load(
            'bryandlee/animegan2-pytorch:main', 
            'generator', 
            pretrained=pretrained_name
        ).to(device).eval()
        return model
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}", file=sys.stderr)
        sys.exit(1)

def anime_color_grading(pil_img):
    """
    Pre-processes the image to look more like anime:
    1. Brightens shadows (Anime characters don't have dark nose shadows)
    2. Boosts vibrance (Anime has pop colors)
    3. Cools down the tone (Anime is often cooler/bluer than real life)
    """
    # 1. Brightness Boost (Make skin look pale/anime-like)
    enhancer = ImageEnhance.Brightness(pil_img)
    pil_img = enhancer.enhance(1.2) # 20% Brighter
    
    # 2. Contrast Flattening (Reduces harsh shadows)
    enhancer = ImageEnhance.Contrast(pil_img)
    pil_img = enhancer.enhance(0.9) # Slightly flatter
    
    # 3. Saturation Boost (Anime colors)
    enhancer = ImageEnhance.Color(pil_img)
    pil_img = enhancer.enhance(1.3) # 30% More colorful
    
    return pil_img

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--frames', required=True)
    p.add_argument('--out', required=True)
    # We default to 'hayao' now as it is more "Anime" than FacePaint
    p.add_argument('--pretrained', default='hayao') 
    p.add_argument('--device', default='cuda')
    p.add_argument('--resize', default=None)
    p.add_argument('--local_ckpt', default=None)
    
    args = p.parse_args()

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    in_dir = Path(args.frames)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Force Hayao if the user didn't specify (it usually looks more like anime)
    model_name = args.pretrained if args.pretrained else 'hayao'
    model = load_generator(model_name, device)

    # Normalization [-1, 1]
    tf = T.Compose([
        T.ToTensor(),
        T.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])

    files = sorted(in_dir.glob('frame_*.png'))
    print(f"[INFO] Processing {len(files)} frames with {model_name}...", file=sys.stderr)

    for i, f in enumerate(files):
        try:
            img = Image.open(f).convert('RGB')
            
            # STEP 1: Apply Anime Color Grading BEFORE the AI
            # This helps the AI see "flat" colors instead of complex human skin
            img = anime_color_grading(img)

            inp = tf(img).unsqueeze(0).to(device)

            with torch.no_grad():
                out = model(inp)

            # Denormalize
            out = out * 0.5 + 0.5
            out = out.clamp(0, 1).squeeze(0).cpu()

            # Save
            save_path = out_dir / f.name
            T.ToPILImage()(out).save(save_path)

        except Exception as e:
            print(f"[ERROR] Frame {f.name}: {e}", file=sys.stderr)

    print("[DONE] Stylization complete", file=sys.stderr)

if __name__ == '__main__':
    main()