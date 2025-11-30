import torch, sys
print("torch", torch.__version__)
print("cuda available:", torch.cuda.is_available())
print("cuda count:", torch.cuda.device_count())
print("device name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "none")
