import torch
import cv2
import numpy as np
from PIL import Image, ImageEnhance
import torchvision.transforms as T
import sys
import os
import subprocess

def ultra_flat_anime(pil_img):
    """
    Aggressively flattens the image to remove 'human' 3D shading
    and make it look like a 2D drawing.
    """
    # Convert to OpenCV BGR
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    
    # 1. ITERATIVE SMOOTHING (The "Plastic" Look)
    # We run this multiple times to erase skin pores and nose shadows
    for _ in range(2):
        img = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)
    
    # 2. BRIGHTNESS BOOST (Anime skin is almost white/flat)
    # This blows out the subtle shadows on the cheeks/nose
    cols_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    cols_hsv[:,:,2] = cv2.add(cols_hsv[:,:,2], 30) # Add brightness
    img = cv2.cvtColor(cols_hsv, cv2.COLOR_HSV2BGR)

    # 3. THIN LINEART (Subtle outlines, not thick ones)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 3)
    edges = cv2.adaptiveThreshold(
        gray, 255, 
        cv2.ADAPTIVE_THRESH_MEAN_C, 
        cv2.THRESH_BINARY, 7, 7 # Smaller block size = finer lines
    )
    
    # Combine smooth colors with thin lines
    img = cv2.bitwise_and(img, img, mask=edges)

    # 4. COLOR GRADING
    final_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    
    # High Saturation (Anime colors)
    final_pil = ImageEnhance.Color(final_pil).enhance(1.5)
    # High Contrast (To remove grey areas)
    final_pil = ImageEnhance.Contrast(final_pil).enhance(1.2)
    
    return final_pil

def convert_video(video_path):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Loading AI on {device}...")
    
    try:
        # We stick with 'face_paint_512_v2' as it is the only one that understands faces
        model = torch.hub.load(
            'bryandlee/animegan2-pytorch:main', 
            'generator', 
            pretrained='face_paint_512_v2'
        ).to(device).eval()
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    cap = cv2.VideoCapture(video_path)
    width = 1280
    height = 720
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    out_name = "ultra_flat_temp.mp4"
    out = cv2.VideoWriter(out_name, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

    tf = T.Compose([
        T.Resize((height, width)),
        T.ToTensor(),
        T.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])

    print(f"Processing {total_frames} frames (Ultra-Flat Mode)...")
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        inp = tf(pil_img).unsqueeze(0).to(device)
        
        with torch.no_grad():
            output = model(inp)
        
        output = output * 0.5 + 0.5
        output = output.clamp(0, 1).squeeze(0).cpu()
        
        anime_pil = T.ToPILImage()(output)
        
        # Apply the aggressive flattening filter
        final_pil = ultra_flat_anime(anime_pil)
        
        final_bgr = cv2.cvtColor(np.array(final_pil), cv2.COLOR_RGB2BGR)
        out.write(final_bgr)
        
        frame_count += 1
        print(f"Processed: {frame_count}/{total_frames}", end='\r')

    cap.release()
    out.release()
    print("\nAdding Audio...")
    
    final_out = "FINAL_ULTRA_ANIME.mp4"
    subprocess.run(f'ffmpeg -y -i "{out_name}" -i "{video_path}" -c copy -map 0:v:0 -map 1:a:0 "{final_out}"', shell=True)
    print(f"DONE! Saved to {final_out}")

if __name__ == "__main__":
    raw_input = input("Drag and drop your video file here and press Enter: ")
    video_path = raw_input.replace('&', '').replace("'", "").replace('"', "").strip()
    convert_video(video_path)