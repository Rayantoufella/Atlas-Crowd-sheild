import cv2
import numpy as np
import os
import time
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(os.path.dirname(BASE_DIR), "Algorithm", "yolov8n.pt")
SNAPSHOT_DIR = os.path.join(BASE_DIR, "uploads", "snapshots")

os.makedirs(SNAPSHOT_DIR, exist_ok=True)

model = YOLO(MODEL_PATH)

DETECTION_LABELS = {
    "BAGARRE": "Fight",
    "COURSE": "Running",
    "SOL": "Fallen",
    "ATTROUPEMENT": "Crowding",
}

THRESHOLD = 40

def iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0

def process_video(video_path, job_id, progress_callback, frame_callback=None):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        progress_callback(job_id, {"status": "error", "error": "Cannot open video file"})
        return

    STREAM_W = 854

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_idx = 0
    prev_boxes = []
    detections = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        h, w = frame.shape[:2]
        left_bound = w // 3
        right_bound = 2 * w // 3

        results = model(frame, classes=[0], conf=0.4)
        boxes_info = []

        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            boxes_info.append((x1, y1, x2, y2, cx, cy))

        cur_centroids = [(cx, cy) for (_, _, _, _, cx, cy) in boxes_info]

        speeds = [0] * len(boxes_info)
        if prev_boxes:
            prev_centroids = [(cx, cy) for (_, _, _, _, cx, cy) in prev_boxes]
            for i, (cx, cy) in enumerate(cur_centroids):
                best_dist = 999
                best_j = -1
                for j, (px, py) in enumerate(prev_centroids):
                    d = np.sqrt((cx - px)**2 + (cy - py)**2)
                    if d < best_dist:
                        best_dist = d
                        best_j = j
                if best_dist < 50:
                    old_x1, old_y1, old_x2, old_y2, _, _ = prev_boxes[best_j]
                    old_cx = (old_x1 + old_x2) // 2
                    old_cy = (old_y1 + old_y2) // 2
                    dx = cx - old_cx
                    dy = cy - old_cy
                    speeds[i] = np.sqrt(dx*dx + dy*dy)

        prev_boxes = boxes_info[:]

        predictions = [""] * len(boxes_info)
        pred_conf = [0] * len(boxes_info)
        confidences = [0] * len(boxes_info)

        for i in range(len(boxes_info)):
            x1, y1, x2, y2, cx, cy = boxes_info[i]
            bw = x2 - x1
            bh = y2 - y1

            max_conf = 0
            best_pred = ""

            if speeds[i] > 12:
                c = min(100, int(speeds[i] * 5))
                if c > max_conf:
                    max_conf = c
                    best_pred = "COURSE"

            if bw > bh * 1.3:
                c = 85
                if c > max_conf:
                    max_conf = c
                    best_pred = "SOL"

            for j in range(i + 1, len(boxes_info)):
                x1b, y1b, x2b, y2b, _, _ = boxes_info[j]
                overlap = iou((x1, y1, x2, y2), (x1b, y1b, x2b, y2b))
                if overlap > 0.15 and (speeds[i] > 8 or speeds[j] > 8):
                    c = min(100, int(overlap * 150 + max(speeds[i], speeds[j]) * 3))
                    if c > max_conf:
                        max_conf = c
                        best_pred = "BAGARRE"

            predictions[i] = best_pred
            pred_conf[i] = max_conf
            confidences[i] = max_conf

        for i in range(len(boxes_info)):
            if predictions[i] in ("BAGARRE", "SOL"):
                continue
            x1, y1, x2, y2, cx, cy = boxes_info[i]
            count_near = 0
            for j in range(len(boxes_info)):
                if i != j:
                    _, _, _, _, cxj, cyj = boxes_info[j]
                    if np.sqrt((cx - cxj)**2 + (cy - cyj)**2) < 80:
                        count_near += 1
            if count_near >= 3:
                c = min(100, count_near * 25)
                if c > confidences[i]:
                    predictions[i] = "ATTROUPEMENT"
                    confidences[i] = c

        sensitive = [conf >= THRESHOLD for conf in confidences]

        stream_frame = frame.copy()
        for idx, (x1, y1, x2, y2, cx, cy) in enumerate(boxes_info):
            pred = predictions[idx]
            conf = confidences[idx]

            if not sensitive[idx]:
                cv2.rectangle(stream_frame, (x1, y1), (x2, y2), (100, 100, 255), 1)
                continue

            label_text = pred if pred else "SUSPECT"
            snapshot_key = f"{job_id}_f{frame_idx}_p{idx}"
            snapshot_fn = f"{snapshot_key}.jpg"

            cv2.rectangle(stream_frame, (x1 - 4, y1 - 4), (x2 + 4, y2 + 4), (0, 0, 255), 4)
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(stream_frame, (x1, y1 - th - 8), (x1 + tw + 6, y1 - 2), (0, 0, 200), -1)
            cv2.putText(stream_frame, label_text, (x1 + 3, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            cv2.putText(stream_frame, f'{conf}%', (x2 - 30, y2 + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

            cv2.imwrite(os.path.join(SNAPSHOT_DIR, snapshot_fn), stream_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])

            timestamp_sec = frame_idx / fps if fps > 0 else 0
            detections.append({
                "id": snapshot_key,
                "frame": frame_idx,
                "timestamp": round(timestamp_sec, 2),
                "label": pred,
                "label_en": DETECTION_LABELS.get(pred, pred),
                "confidence": conf,
                "snapshot": snapshot_fn,
                "bbox": [x1, y1, x2, y2],
            })

        cv2.line(stream_frame, (left_bound, 0), (left_bound, h), (255, 255, 0), 2)
        cv2.line(stream_frame, (right_bound, 0), (right_bound, h), (255, 255, 0), 2)

        sc = sum(sensitive)
        total = len(boxes_info)
        right_text_x = w - 200
        cv2.rectangle(stream_frame, (right_text_x - 10, 10), (w - 10, 90), (0, 0, 0), -1)
        cv2.putText(stream_frame, f'Frame: {frame_idx}', (right_text_x, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        cv2.putText(stream_frame, f'People: {total}', (right_text_x, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        cv2.putText(stream_frame, f'Suspicious: {sc}', (right_text_x, 68), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)

        if frame_callback:
            sy = stream_frame.shape[0] * STREAM_W // stream_frame.shape[1]
            stream_small = cv2.resize(stream_frame, (STREAM_W, sy))
            _, jpeg_bytes = cv2.imencode('.jpg', stream_small, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
            frame_callback(job_id, jpeg_bytes.tobytes())

        frame_idx += 1
        progress = int((frame_idx / total_frames) * 100) if total_frames > 0 else 0
        progress_callback(job_id, {
            "status": "processing",
            "progress": progress,
            "frame": frame_idx,
            "total_frames": total_frames,
            "detections_count": len(detections),
        })

    cap.release()

    progress_callback(job_id, {
        "status": "done",
        "progress": 100,
        "frame": total_frames,
        "total_frames": total_frames,
        "detections_count": len(detections),
        "detections": detections,
    })
