from algo.yolo_detector import detect_persons
from algo.density_estimator import estimate_density

ZONES = [
    {"id": "gate_1", "label": "Porte 1 Nord", "region": (0.0, 0.0, 0.33, 0.5)},
    {"id": "gate_2", "label": "Porte 2 Nord-Est", "region": (0.33, 0.0, 0.66, 0.5)},
    {"id": "gate_3", "label": "Porte 3 Est", "region": (0.66, 0.0, 1.0, 0.5)},
    {"id": "gate_4", "label": "Porte 4 Sud", "region": (0.0, 0.5, 0.33, 1.0)},
    {"id": "gate_5", "label": "Porte 5 Ouest", "region": (0.33, 0.5, 0.66, 1.0)},
    {"id": "gate_6", "label": "Porte 6 Nord-Ouest", "region": (0.66, 0.5, 1.0, 1.0)},
]

MAX_PERSONS_PER_ZONE = 20


def get_status(risk):
    if risk >= 75:
        return "critical"
    if risk >= 60:
        return "warning"
    if risk >= 40:
        return "watch"
    return "safe"


def get_density(risk):
    if risk >= 60:
        return "high"
    if risk >= 35:
        return "medium"
    return "low"


def calculate_risk(frame):
    h, w = frame.shape[:2]
    zone_results = []

    for zone in ZONES:
        x1 = int(zone["region"][0] * w)
        y1 = int(zone["region"][1] * h)
        x2 = int(zone["region"][2] * w)
        y2 = int(zone["region"][3] * h)

        cropped = frame[y1:y2, x1:x2]
        count = detect_persons(cropped)
        risk = min(100, int((count / MAX_PERSONS_PER_ZONE) * 100))

        zone_results.append({
            "id": zone["id"],
            "label": zone["label"],
            "risk": risk,
            "status": get_status(risk),
            "density": get_density(risk),
        })

    global_risk = int(sum(z["risk"] for z in zone_results) / len(zone_results))
    return {"global_risk": global_risk, "zones": zone_results}
