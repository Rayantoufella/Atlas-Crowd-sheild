from ultralytics import YOLO

model = YOLO("yolov8n.pt")


def detect_persons(frame):
    results = model(frame, classes=[0], verbose=False)
    return len(results[0].boxes)
