import cv2
import numpy as np
from ultralytics import YOLO
from collections import defaultdict

model = YOLO('yolov8n.pt')
cap = cv2.VideoCapture('match_stade.mp4')

history = defaultdict(list)
MAX_HISTORY = 20
next_id = 0

for frame_idx in range(438):
    ret, frame = cap.read()
    if not ret:
        break

    h, w = frame.shape[:2]
    results = model(frame, classes=[0], conf=0.4, verbose=False)
    total = len(results[0].boxes)

    cur_boxes = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        cur_boxes.append((x1, y1, x2, y2, cx, cy))

    all_prev = [(pid, pos_list[-1]) for pid, pos_list in history.items() if pos_list]
    used_ids = set()
    cur_ids = [-1] * len(cur_boxes)

    for i, (_, _, _, _, cx, cy) in enumerate(cur_boxes):
        best_d, best_pid = 999, -1
        for pid, (px, py) in all_prev:
            if pid in used_ids:
                continue
            d = np.sqrt((cx - px) ** 2 + (cy - py) ** 2)
            if d < best_d and d < 100:
                best_d, best_pid = d, pid
        if best_pid >= 0:
            cur_ids[i] = best_pid
            used_ids.add(best_pid)
        else:
            cur_ids[i] = next_id
            next_id += 1

    for i, (_, _, _, _, cx, cy) in enumerate(cur_boxes):
        pid = cur_ids[i]
        history[pid].append((cx, cy))
        if len(history[pid]) > MAX_HISTORY:
            history[pid].pop(0)

    confidences = [0] * len(cur_boxes)
    predictions = [""] * len(cur_boxes)
    risk_levels = [0] * len(cur_boxes)

    max_approach = 0

    for i in range(len(cur_boxes)):
        x1i, y1i, x2i, y2i, cxi, cyi = cur_boxes[i]
        pi = cur_ids[i]
        hi = history[pi]

        max_conf, best_pred, best_risk = 0, "", 0

        for j in range(i + 1, len(cur_boxes)):
            x1j, y1j, x2j, y2j, cxj, cyj = cur_boxes[j]
            pj = cur_ids[j]
            hj = history[pj]

            cur_dist = np.sqrt((cxi - cxj) ** 2 + (cyi - cyj) ** 2)
            lookback = min(8, len(hi) - 1, len(hj) - 1)

            if lookback >= 3:
                pxi, pyi = hi[-lookback]
                pxj, pyj = hj[-lookback]
                prev_dist = np.sqrt((pxi - pxj) ** 2 + (pyi - pyj) ** 2)
                approach_v = (prev_dist - cur_dist) / lookback
                if approach_v > max_approach:
                    max_approach = approach_v

                if approach_v > 1.5:
                    if approach_v > 0:
                        ttc = cur_dist / approach_v
                    else:
                        ttc = 999

                    if cur_dist < 80 and approach_v > 2:
                        risk, conf, pred = 3, min(95, int(approach_v * 15 + 30)), f"DANGER t={ttc:.1f}s"
                    elif cur_dist < 150 and approach_v > 4:
                        risk, conf, pred = 3, min(90, int(approach_v * 10 + 25)), "DANGER imminent"
                    elif cur_dist < 250 and approach_v > 4:
                        risk, conf, pred = 2, min(80, int(approach_v * 8 + 20)), "WARNING approche"
                    elif approach_v > 3:
                        risk, conf, pred = 2, min(70, int(approach_v * 7 + 15)), "WARNING vitesse"
                    elif approach_v > 2:
                        risk, conf, pred = 1, min(55, int(approach_v * 8)), "WATCH approche"
                    else:
                        risk, conf, pred = 1, min(40, int(approach_v * 8)), "WATCH"

                    if conf > max_conf:
                        max_conf, best_pred, best_risk = conf, pred, max(risk, best_risk)

        risk_levels[i] = max(risk_levels[i], best_risk)
        if max_conf > confidences[i]:
            predictions[i], confidences[i] = best_pred, max_conf

    alerts = [(p, c, r) for p, c, r in zip(predictions, confidences, risk_levels) if c >= 40]
    if alerts:
        print(f'Frame {frame_idx}/{438}: {total} pers | alerts={len(alerts)} max_approach={max_approach:.1f}', end='')
        for p, c, r in alerts[:3]:
            print(f' [{p} {c}% lvl{r}]', end='')
        print()

cap.release()
print(f'\n=== DONE === Tracked {next_id} unique people')
print(f'Video processed: {frame_idx+1} frames')
