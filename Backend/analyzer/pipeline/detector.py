import numpy as np
from ultralytics import YOLO
from ..config import (
    DETECTION_MODEL, DEVICE, IOU_THRESHOLD,
    INPUT_SIZE, TRACKER_CONFIG, DANGEROUS_CLASS_IDS,
    THIN_ROD_ASPECT_RATIO, THIN_ROD_MAX_WIDTH_PX,
)
from ..runtime_config import get as cfg
from . import BBox, Detection

def compute_iou(a: BBox, b: BBox) -> float:
    x_left = max(a.x1, b.x1)
    y_top = max(a.y1, b.y1)
    x_right = min(a.x2, b.x2)
    y_bottom = min(a.y2, b.y2)
    if x_right < x_left or y_bottom < y_top:
        return 0.0
    inter_area = (x_right - x_left) * (y_bottom - y_top)
    area_a = (a.x2 - a.x1) * (a.y2 - a.y1)
    area_b = (b.x2 - b.x1) * (b.y2 - b.y1)
    return inter_area / float(area_a + area_b - inter_area)

class Detector:
    def __init__(self) -> None:
        self._device = DEVICE
        self._det = YOLO(DETECTION_MODEL)
        self._det.eval()
        self._last_objects: list[Detection] = []

    @property
    def last_objects(self) -> list[Detection]:
        return self._last_objects

    def run(self, frame: np.ndarray, frame_index: int) -> list[Detection]:
        det_results = self._det.track(
            frame, persist=True, tracker=TRACKER_CONFIG,
            conf=cfg("conf_threshold"), iou=IOU_THRESHOLD,
            imgsz=INPUT_SIZE, verbose=False, device=self._device,
        )
        boxes_data = det_results[0].boxes
        if boxes_data is None:
            self._last_objects = []
            return []

        xyxy = boxes_data.xyxy
        confs = boxes_data.conf
        cls_ids = boxes_data.cls
        track_ids = boxes_data.id

        person_detections: list[Detection] = []
        raw_person_boxes: list[tuple] = []
        object_detections: list[Detection] = []

        for i in range(len(xyxy)):
            x1, y1, x2, y2 = xyxy[i].tolist()
            x1_i, y1_i, x2_i, y2_i = int(x1), int(y1), int(x2), int(y2)
            conf = float(confs[i])
            cls_id = int(cls_ids[i])
            bbox = BBox(x1_i, y1_i, x2_i, y2_i)
            track_id: int | None = None
            if track_ids is not None:
                track_id = int(track_ids[i].item())

            if cls_id == 0:
                if track_id is None or track_id < 0:
                    track_id = -(i + 1)
                det = Detection(track_id=track_id, bbox=bbox, confidence=conf, class_name="person")
                person_detections.append(det)
                raw_person_boxes.append((x1_i, y1_i, x2_i, y2_i))
            elif cls_id in DANGEROUS_CLASS_IDS:
                det = Detection(track_id=-(i + 1000), bbox=bbox, confidence=conf, class_name=_map_class_id(cls_id))
                object_detections.append(det)

            if bbox.width > 0 and bbox.height / bbox.width >= THIN_ROD_ASPECT_RATIO and bbox.width <= THIN_ROD_MAX_WIDTH_PX:
                existing = False
                for obj_det in object_detections:
                    if obj_det.bbox == bbox:
                        obj_det.class_name = "thin_rod"
                        existing = True; break
                if not existing:
                    det = Detection(track_id=-(i + 1000), bbox=bbox, confidence=conf, class_name="thin_rod")
                    object_detections.append(det)

        if not person_detections:
            fallback = self._det(frame, conf=0.15, iou=0.30, imgsz=INPUT_SIZE, device=self._device, verbose=False)
            fb_boxes = fallback[0].boxes
            if fb_boxes is not None and len(fb_boxes) > 0:
                for i in range(len(fb_boxes)):
                    x1, y1, x2, y2 = fb_boxes.xyxy[i].tolist()
                    x1_i, y1_i, x2_i, y2_i = int(x1), int(y1), int(x2), int(y2)
                    conf = float(fb_boxes.conf[i])
                    cls_id = int(fb_boxes.cls[i])
                    bbox = BBox(x1_i, y1_i, x2_i, y2_i)
                    if cls_id == 0:
                        det = Detection(track_id=-1, bbox=bbox, confidence=conf, class_name="person")
                        person_detections.append(det)
                        raw_person_boxes.append((x1_i, y1_i, x2_i, y2_i))
                    elif cls_id in DANGEROUS_CLASS_IDS:
                        det = Detection(track_id=-(i + 2000), bbox=bbox, confidence=conf, class_name=_map_class_id(cls_id))
                        object_detections.append(det)
                    if bbox.width > 0 and bbox.height / bbox.width >= THIN_ROD_ASPECT_RATIO and bbox.width <= THIN_ROD_MAX_WIDTH_PX:
                        existing = False
                        for obj_det in object_detections:
                            if obj_det.bbox == bbox:
                                obj_det.class_name = "thin_rod"
                                existing = True; break
                        if not existing:
                            det = Detection(track_id=-(i + 2000), bbox=bbox, confidence=conf, class_name="thin_rod")
                            object_detections.append(det)

        for obj_det in object_detections:
            best_iou = 0.0
            best_person = None
            for person_det in person_detections:
                iou_val = compute_iou(obj_det.bbox, person_det.bbox)
                if iou_val > best_iou:
                    best_iou = iou_val
                    best_person = person_det
            if best_person is not None:
                best_person.signals_hint_object = True
                best_person.signals_hint_object_type = obj_det.class_name

        self._last_objects = object_detections
        return person_detections

def _map_class_id(cls_id: int) -> str:
    mapping = {38: "baseball bat", 49: "knife"}
    return mapping.get(cls_id, f"object_{cls_id}")
