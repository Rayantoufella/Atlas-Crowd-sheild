import cv2
import numpy as np
from ..config import (
    TIER_COLORS, BBOX_THICKNESS, LABEL_FONT, LABEL_FONT_SCALE, LABEL_FONT_THICK,
    HUD_HEIGHT_PX, HUD_BG_COLOR, HUD_BG_ALPHA, HUD_FONT, HUD_FONT_SCALE, HUD_FONT_THICKNESS,
    ZONE_DISPLAY,
)
from . import PersonState, ZoneState, Detection

class Renderer:
    def draw(self, frame: np.ndarray, person_states: list[PersonState],
             zone_state: ZoneState, danger_objects: list[Detection]) -> np.ndarray:
        out = frame.copy()
        h, w = out.shape[:2]

        label_map = {"high": "HIGH", "critical": "CRIT", "medium": "MED", "low": "LOW"}

        for p in person_states:
            color = TIER_COLORS.get(p.risk_tier, (100, 100, 100))
            bbox = p.bbox
            cv2.rectangle(out, (bbox.x1, bbox.y1), (bbox.x2, bbox.y2), color, BBOX_THICKNESS)

            label_text = f"ID:{p.track_id} {label_map.get(p.risk_tier, p.risk_tier)} {p.risk_score:.2f}"
            (lw, lh), _ = cv2.getTextSize(label_text, LABEL_FONT, 0.4, 1)
            ly1 = bbox.y1 - lh - 6
            lx1 = bbox.x1
            if ly1 < 0:
                ly1 = bbox.y1 + 2
            cv2.rectangle(out, (lx1, ly1), (lx1 + lw + 6, ly1 + lh + 4), color, -1)
            cv2.putText(out, label_text, (lx1 + 3, ly1 + lh + 1), LABEL_FONT, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

        for obj in danger_objects:
            bbox = obj.bbox
            cv2.rectangle(out, (bbox.x1, bbox.y1), (bbox.x2, bbox.y2), (0, 0, 255), 2)
            label_text = obj.class_name.upper()[:12]
            (lw, lh), _ = cv2.getTextSize(label_text, LABEL_FONT, 0.4, 1)
            ly1 = bbox.y1 - lh - 6
            lx1 = bbox.x1
            if ly1 < 0: ly1 = bbox.y1 + 2
            cv2.rectangle(out, (lx1, ly1), (lx1 + lw + 6, ly1 + lh + 4), (0, 0, 255), -1)
            cv2.putText(out, label_text, (lx1 + 3, ly1 + lh + 1), LABEL_FONT, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

        overlay = out.copy()
        cv2.rectangle(overlay, (0, 0), (w, HUD_HEIGHT_PX), HUD_BG_COLOR, -1)
        cv2.addWeighted(overlay, HUD_BG_ALPHA, out, 1 - HUD_BG_ALPHA, 0, out)

        zone_cfg = ZONE_DISPLAY.get(zone_state.label, ZONE_DISPLAY["CALM"])
        zone_color = zone_cfg["color"]
        zone_text = zone_cfg["text"]

        cv2.line(out, (0, HUD_HEIGHT_PX), (w, HUD_HEIGHT_PX), zone_color, 3)
        (tw, th), _ = cv2.getTextSize(zone_text, HUD_FONT, HUD_FONT_SCALE, HUD_FONT_THICKNESS)
        text_x = (w - tw) // 2
        text_y = (HUD_HEIGHT_PX + th) // 2
        cv2.putText(out, zone_text, (text_x, text_y), HUD_FONT, HUD_FONT_SCALE, zone_color, HUD_FONT_THICKNESS, cv2.LINE_AA)

        info_text = f"Tracking: {len(person_states)}  High risk: {zone_state.high_risk_count}"
        (iw, ih), _ = cv2.getTextSize(info_text, LABEL_FONT, 0.7, 1)
        cv2.putText(out, info_text, (w - iw - 16, text_y), LABEL_FONT, 0.7, (200, 200, 200), 1, cv2.LINE_AA)

        cv2.putText(out, f"Frame: {zone_state.frame_index}", (16, text_y), LABEL_FONT, 0.7, (200, 200, 200), 1, cv2.LINE_AA)

        return out
