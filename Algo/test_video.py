import cv2
import numpy as np
from ultralytics import YOLO

model = YOLO('yolov8n.pt')

cap = cv2.VideoCapture('2.mp4')
if not cap.isOpened():
    print("Erreur : impossible d'ouvrir 2.mp4")
    exit()

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

prev_boxes = []
alert_frame = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w = frame.shape[:2]
    left_bound = w // 3
    right_bound = 2 * w // 3

    results = model(frame, classes=[0], conf=0.4)
    total = len(results[0].boxes)

    left_count = center_count = right_count = 0
    boxes_info = []

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        if cx < left_bound:
            left_count += 1
        elif cx < right_bound:
            center_count += 1
        else:
            right_count += 1
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

    THRESHOLD = 40
    sensitive = [conf >= THRESHOLD for conf in confidences]

    reason_final = [""] * len(boxes_info)
    for i in range(len(boxes_info)):
        if sensitive[i] and confidences[i] >= THRESHOLD:
            reason_final[i] = predictions[i]

    has_alert = any(sensitive)
    if has_alert:
        alert_frame += 1
    else:
        alert_frame = 0

    alert_bright = (alert_frame // 5) % 2 == 0

    for idx, (x1, y1, x2, y2, cx, cy) in enumerate(boxes_info):
        pred = predictions[idx]
        conf = confidences[idx]

        if not sensitive[idx]:
            cv2.rectangle(frame, (x1, y1), (x2, y2), (100, 100, 255), 1)
            cv2.putText(frame, 'OK', (x1, y2 + 14),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (100, 255, 100), 1)
            continue

        label = pred if pred else "SUSPECT"
        color = (0, 0, 255)

        cv2.rectangle(frame, (x1 - 4, y1 - 4), (x2 + 4, y2 + 4), color, 4)

        if alert_bright:
            cv2.rectangle(frame, (x1 - 6, y1 - 6), (x2 + 6, y2 + 6), (0, 255, 255), 2)

        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 6, y1 - 2), (0, 0, 200), -1)
        cv2.putText(frame, label, (x1 + 3, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

        cv2.putText(frame, f'{conf}%', (x2 - 30, y2 + 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

    cv2.line(frame, (left_bound, 0), (left_bound, h), (255, 255, 0), 2)
    cv2.line(frame, (right_bound, 0), (right_bound, h), (255, 255, 0), 2)

    if has_alert and alert_bright:
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 70), (0, 0, 255), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

        reasons_list = [p for p in predictions if p]
        reason_text = " / ".join(sorted(set(reasons_list))) if reasons_list else "ACTIVITE SUSPECTE"
        cv2.putText(frame, f'PREDICTION: {reason_text}', (w // 2 - 300, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 3)
        cv2.putText(frame, f'ALERTE: {sum(sensitive)}/{total} suspects', (w // 2 - 300, 58),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    if has_alert and alert_bright:
        cv2.rectangle(frame, (0, h - 50), (w, h), (0, 0, 255), -1)
        cv2.putText(frame, 'ALERTE SECURITE - ACTION REQUISE', (w // 2 - 300, h - 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    sx, sy = 15, 85
    cv2.rectangle(frame, (5, sy - 15), (330, sy + 130), (0, 0, 0), -1)
    cv2.rectangle(frame, (5, sy - 15), (330, sy + 130), (100, 100, 100), 1)

    cv2.putText(frame, f'TOTAL: {total}', (sx, sy + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(frame, f'G:{left_count} C:{center_count} D:{right_count}', (sx, sy + 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    sc = sum(sensitive)
    for ri, rt in enumerate([("BAGARRE", (0, 0, 255)), ("COURSE", (0, 165, 255)), ("SOL", (0, 255, 255)), ("ATTROUPEMENT", (0, 0, 255))]):
        cnt = sum(1 for p in predictions if p == rt[0])
        if cnt > 0:
            cv2.putText(frame, f'{rt[0]}: {cnt}', (sx, sy + 55 + ri * 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, rt[1], 2)

    if sc > 0:
        pct = sc / total * 100 if total > 0 else 0
        cv2.putText(frame, f'SUSPECTS: {sc}/{total} ({pct:.0f}%)', (sx, sy + 110),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)
        if pct > 30:
            cv2.putText(frame, 'RISQUE: CRITIQUE', (sx + 170, sy + 110),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        elif pct > 10:
            cv2.putText(frame, 'RISQUE: ELEVE', (sx + 170, sy + 110),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

    if left_count > 20 or center_count > 20 or right_count > 20:
        cv2.putText(frame, 'FOULE DENSE', (w - 180, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    cv2.imshow('Analyse Foule Stade', frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()
