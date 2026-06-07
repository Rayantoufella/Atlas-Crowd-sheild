#!/usr/bin/env python3
"""
Atlas Crowd Shield -- Interactive Conflict Detection Test Suite
================================================================
Simule des scenarios de conflit synthetiques et teste la capacite
de l'algorithme a les detecter AVANT qu'ils ne deviennent critiques.

Utilisation :
    python test_conflict_detection.py
    python test_conflict_detection.py --scenario fight
    python test_conflict_detection.py --list

Scenarios disponibles :
  - normal          : circulation normale (pas de conflit)
  - approach-slow   : deux personnes s'approchent lentement
  - approach-fast   : deux personnes s'approchent rapidement (conflit)
  - crowd           : attroupement de 8 personnes
  - fight           : bagarre simulee (overlap + vitesse)
  - running         : personne qui court dans la foule
  - scatter         : dispersion soudaine (fuite apres incident)
  - all             : execute tous les scenarios
"""

import sys
import math
import time
import argparse
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# 1.  DATACLASSES LEGERS (copie locale pour eviter les dependances au backend)
# ---------------------------------------------------------------------------

@dataclass
class BBox:
    x1: int; y1: int; x2: int; y2: int
    @property
    def cx(self) -> float: return (self.x1 + self.x2) / 2
    @property
    def cy(self) -> float: return (self.y1 + self.y2) / 2

@dataclass
class Detection:
    track_id: int
    bbox: BBox
    confidence: float = 1.0
    class_name: str = "person"
    signals_hint_object: bool = False
    signals_hint_object_type: str = ""

@dataclass
class SignalVector:
    velocity: float
    acceleration: float
    proximity_count: int
    pose_anomaly: float
    object_flag: bool
    object_type: str
    approach_velocity: float = 0.0
    time_to_collision: float = 999.0
    group_size: int = 0

@dataclass
class PersonState:
    track_id: int
    bbox: BBox
    risk_score: float
    risk_tier: str
    signals: SignalVector
    group_id: int = -1

# ---------------------------------------------------------------------------
# 2.  CONFIGURATION (memes valeurs que Backend/analyzer/config.py)
# ---------------------------------------------------------------------------

VELOCITY_NORM_FACTOR = 5.0
VELOCITY_HIGH = 0.70
ACCEL_WINDOW = 3
ACCEL_NORM_FACTOR = 3.0
PROXIMITY_RADIUS_PX = 100
PROXIMITY_HIGH = 5

WEIGHT_VELOCITY = 0.30
WEIGHT_ACCEL = 0.15
WEIGHT_PROXIMITY = 0.15
WEIGHT_OBJECT = 0.10
WEIGHT_APPROACH = 0.20

APPROACH_LOOKBACK = 3
APPROACH_V_LOW = 1.5
APPROACH_V_MED = 2.5
APPROACH_V_HIGH = 4.0
APPROACH_NORM_FACTOR = 5.0

GROUP_RADIUS_PX = 80
GROUP_MIN_SIZE = 3

THRESH_LOW = 0.20
THRESH_MEDIUM = 0.32
THRESH_HIGH = 0.45

ZONE_CALM = 0.20
ZONE_WATCH = 0.30
ZONE_WARNING = 0.42
CRITICAL_PERSISTENCE_FRAMES = 15

# Seuils pour l'approche-velocity (empruntes a headless_test.py)
APPROACH_V_LOW = 1.5     # en dessous = normal
APPROACH_V_MED = 2.5     # warning
APPROACH_V_HIGH = 4.0    # danger imminent
TTC_THRESHOLD = 3.0      # secondes estimees avant collision

TIER_NAMES = {
    "low": "LOW",
    "medium": "MEDIUM",
    "high": "HIGH",
    "critical": "CRITICAL",
}
TIER_COLORS = {
    "low": "\033[92m",
    "medium": "\033[93m",
    "high": "\033[38;5;208m",
    "critical": "\033[91m",
}
RESET = "\033[0m"
BOLD = "\033[1m"

# ---------------------------------------------------------------------------
# 3.  COMPORTEMENT ENGINE (copie locale du BehaviorEngine)
# ---------------------------------------------------------------------------

from collections import deque as _deque

def _compute_velocity(centroid_history):
    if len(centroid_history) < 2:
        return 0.0
    steps = min(3, len(centroid_history) - 1)
    dx = centroid_history[-1][0] - centroid_history[-(steps + 1)][0]
    dy = centroid_history[-1][1] - centroid_history[-(steps + 1)][1]
    raw_speed = math.sqrt(dx * dx + dy * dy) / steps
    return min(raw_speed / VELOCITY_NORM_FACTOR, 1.0)

def _compute_acceleration(velocity_history):
    if len(velocity_history) < 2:
        return 0.0
    accel = abs(velocity_history[-1] - velocity_history[-2])
    return min(accel / (ACCEL_NORM_FACTOR / 100), 1.0)

def _compute_proximity(detection, all_detections):
    count = 0
    for other in all_detections:
        if other.track_id == detection.track_id:
            continue
        dist = math.hypot(detection.bbox.cx - other.bbox.cx, detection.bbox.cy - other.bbox.cy)
        if dist <= PROXIMITY_RADIUS_PX:
            count += 1
    return count

def compute_approach_pairs(detections, prev_centroids):
    """Calcule les paires en approche (approach velocity + TTC)."""
    pairs = []
    for i in range(len(detections)):
        for j in range(i + 1, len(detections)):
            a, b = detections[i], detections[j]
            cur_dist = math.hypot(a.bbox.cx - b.bbox.cx, a.bbox.cy - b.bbox.cy)
            if cur_dist < 5:
                continue
            approach_v = 0.0
            p_a = prev_centroids.get(a.track_id)
            p_b = prev_centroids.get(b.track_id)
            if p_a and p_b:
                prev_dist = math.hypot(p_a[0] - p_b[0], p_a[1] - p_b[1])
                approach_v = max(0.0, prev_dist - cur_dist)
            sev = 0
            if approach_v > APPROACH_V_HIGH and cur_dist < 80:
                sev = 3
            elif approach_v > APPROACH_V_MED and cur_dist < 150:
                sev = 2
            elif approach_v > APPROACH_V_LOW and cur_dist < 300:
                sev = 1
            ttc = cur_dist / approach_v if approach_v > 0.1 else 999.0
            if sev > 0:
                pairs.append({
                    "id_a": a.track_id, "id_b": b.track_id,
                    "approach_v": approach_v, "dist": cur_dist,
                    "ttc": ttc, "severity": sev,
                })
    return pairs

def detect_groups(detections, radius=GROUP_RADIUS_PX, min_size=GROUP_MIN_SIZE):
    """Detecte les groupes par clustering hierarchique."""
    if len(detections) < min_size:
        return []
    n = len(detections)
    assigned = set()
    groups = []
    next_gid = 0
    for i in range(n):
        if i in assigned:
            continue
        cluster = [i]
        assigned.add(i)
        changed = True
        while changed:
            changed = False
            for j in range(n):
                if j in assigned:
                    continue
                cj = (detections[j].bbox.cx, detections[j].bbox.cy)
                for ci_idx in cluster:
                    ci = detections[ci_idx]
                    dist = math.hypot(ci.bbox.cx - cj[0], ci.bbox.cy - cj[1])
                    if dist <= radius:
                        cluster.append(j)
                        assigned.add(j)
                        changed = True
                        break
        if len(cluster) >= min_size:
            groups.append((next_gid, cluster))
            next_gid += 1
    return groups

def compute_risk_scores(detections, tracks, frame_index, prev_centroids):
    """Calcule les scores de risque pour chaque detection (copie du BehaviorEngine)."""
    if not detections:
        return [], []

    for det in detections:
        tid = det.track_id
        if tid not in tracks:
            tracks[tid] = {"centroids": _deque(maxlen=6), "velocities": _deque(maxlen=3), "last_seen": -1}
        tracks[tid]["centroids"].append((det.bbox.cx, det.bbox.cy))
        tracks[tid]["last_seen"] = frame_index

    stale = [tid for tid, rec in tracks.items() if frame_index - rec["last_seen"] > 30]
    for tid in stale:
        del tracks[tid]

    approach_pairs = compute_approach_pairs(detections, prev_centroids)
    groups = detect_groups(detections)

    group_map = {}
    for gid, members in groups:
        for mid in members:
            group_map[detections[mid].track_id] = gid

    person_states = []
    for det in detections:
        tid = det.track_id
        rec = tracks[tid]
        velocity = _compute_velocity(rec["centroids"])
        rec["velocities"].append(velocity)
        acceleration = _compute_acceleration(rec["velocities"])
        proximity = _compute_proximity(det, detections)

        approach_v = 0.0
        ttc = 999.0
        for ap in approach_pairs:
            if ap["id_a"] == tid or ap["id_b"] == tid:
                if ap["approach_v"] > approach_v:
                    approach_v = ap["approach_v"]
                    ttc = ap["ttc"]

        group_size_val = 0
        gid = group_map.get(tid, -1)
        if gid >= 0:
            for gid2, members in groups:
                if gid2 == gid:
                    group_size_val = len(members)
                    break

        signals = SignalVector(
            velocity=velocity,
            acceleration=acceleration,
            proximity_count=proximity,
            pose_anomaly=0.0,
            object_flag=det.signals_hint_object,
            object_type=det.signals_hint_object_type,
            approach_velocity=approach_v,
            time_to_collision=ttc,
            group_size=group_size_val,
        )

        approach_norm = min(approach_v / APPROACH_NORM_FACTOR, 1.0)

        risk_score = (
            WEIGHT_VELOCITY * signals.velocity
            + WEIGHT_ACCEL * signals.acceleration
            + WEIGHT_PROXIMITY * min(signals.proximity_count / PROXIMITY_HIGH, 1.0)
            + WEIGHT_OBJECT * (1.0 if signals.object_flag else 0.0)
            + WEIGHT_APPROACH * approach_norm
        )
        risk_score = max(0.0, min(1.0, risk_score))

        if risk_score < THRESH_LOW:
            tier = "low"
        elif risk_score < THRESH_MEDIUM:
            tier = "medium"
        elif risk_score < THRESH_HIGH:
            tier = "high"
        else:
            tier = "critical"

        person_states.append(PersonState(
            track_id=tid, bbox=det.bbox,
            risk_score=risk_score, risk_tier=tier,
            signals=signals, group_id=gid,
        ))
    return person_states, approach_pairs

# ---------------------------------------------------------------------------
# 4.  APPROCHE-VELOCITY + TIME-TO-COLLISION
# ---------------------------------------------------------------------------

# (approach + group detection now integrated into compute_risk_scores)

# ---------------------------------------------------------------------------
# 6.  GENERATEUR DE SCENARIOS SYNTHETIQUES
# ---------------------------------------------------------------------------

def interpolate(x1, y1, x2, y2, t):
    """Interpolation lineaire entre deux points."""
    return (x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)

def gen_normal(frame_count=30):
    """Circulation normale -- pas de conflit."""
    frames = []
    # Personnes espacees, mouvement minimal
    centers = [(200, 300), (450, 280), (650, 320), (100, 200), (700, 400)]
    for f in range(frame_count):
        dets = []
        for i, (cx, cy) in enumerate(centers):
            wobble = math.sin(f * 0.05 + i) * 1
            dets.append(Detection(
                track_id=i + 1,
                bbox=BBox(
                    int(cx + wobble - 15), int(cy + wobble - 40),
                    int(cx + wobble + 15), int(cy + wobble + 10),
                ),
            ))
        frames.append(dets)
    return frames, "Normal Flow - Aucun conflit attendu"

def gen_approach_slow(frame_count=45):
    """Deux personnes s'approchent lentement -- WATCH."""
    frames = []
    for f in range(frame_count):
        t = f / frame_count
        x1, y1 = interpolate(100, 300, 350, 300, t)
        x2, y2 = interpolate(600, 300, 360, 300, t)
        dets = [
            Detection(track_id=1, bbox=BBox(int(x1 - 15), int(y1 - 40), int(x1 + 15), int(y1 + 10))),
            Detection(track_id=2, bbox=BBox(int(x2 - 15), int(y2 - 40), int(x2 + 15), int(y2 + 10))),
        ]
        frames.append(dets)
    return frames, "Approche Lente -- Devrait generer WATCH"

def gen_approach_fast(frame_count=30):
    """Deux personnes s'approchent rapidement -- DANGER."""
    frames = []
    for f in range(frame_count):
        t = f / frame_count
        x1, y1 = interpolate(50, 300, 390, 300, t)
        x2, y2 = interpolate(650, 300, 400, 300, t)
        dets = [
            Detection(track_id=1, bbox=BBox(int(x1 - 15), int(y1 - 40), int(x1 + 15), int(y1 + 10))),
            Detection(track_id=2, bbox=BBox(int(x2 - 15), int(y2 - 40), int(x2 + 15), int(y2 + 10))),
        ]
        if t > 0.8:
            dets[0].signals_hint_object = True
            dets[0].signals_hint_object_type = "knife"
        frames.append(dets)
    return frames, "Approche Rapide + Objet Dangereux -- Devrait generer CRITICAL"

def gen_crowd(frame_count=30):
    """Attroupement de 8 personnes -- WARNING."""
    frames = []
    npc = 8
    base_positions = [(400, 300) for _ in range(npc)]
    for f in range(frame_count):
        dets = []
        for i in range(npc):
            angle = (i / npc) * 2 * math.pi + f * 0.05
            radius = 30 + 10 * math.sin(f * 0.1 + i)
            cx = 400 + radius * math.cos(angle)
            cy = 300 + radius * math.sin(angle) * 0.6
            dets.append(Detection(
                track_id=i + 1,
                bbox=BBox(int(cx - 12), int(cy - 35), int(cx + 12), int(cy + 5)),
            ))
        frames.append(dets)
    return frames, "Attroupement -- Devrait generer WARNING"

def gen_fight(frame_count=25):
    """Bagarre simulee -- CRITICAL avec overlap + vitesse."""
    frames = []
    for f in range(frame_count):
        t = f / frame_count
        overlap_x = 380 + 15 * math.sin(f * 0.5)
        overlap_y = 300 + 10 * math.sin(f * 0.7)
        dx1 = -25 + 15 * math.sin(f * 0.6)
        dy1 = -10 + 10 * math.cos(f * 0.4)
        dx2 = 25 + 15 * math.sin(f * 0.6 + 1)
        dy2 = 10 + 10 * math.cos(f * 0.4 + 1)
        dets = [
            Detection(track_id=1,
                bbox=BBox(int(overlap_x + dx1 - 15), int(overlap_y + dy1 - 40),
                          int(overlap_x + dx1 + 15), int(overlap_y + dy1 + 10)),
                signals_hint_object=True, signals_hint_object_type="bat"),
            Detection(track_id=2,
                bbox=BBox(int(overlap_x + dx2 - 15), int(overlap_y + dy2 - 40),
                          int(overlap_x + dx2 + 15), int(overlap_y + dy2 + 10))),
        ]
        if f > 10:
            dets.append(Detection(track_id=3,
                bbox=BBox(int(overlap_x + 20 * math.sin(f * 0.3) - 12),
                          int(overlap_y - 40 * abs(math.sin(f * 0.2)) - 35),
                          int(overlap_x + 20 * math.sin(f * 0.3) + 12),
                          int(overlap_y - 40 * abs(math.sin(f * 0.2)) + 5)),
                class_name="person"))
        frames.append(dets)
    return frames, "Bagarre -- Devrait generer CRITICAL avec overlap"

def gen_running(frame_count=30):
    """Personne qui court dans la foule -- HIGH."""
    frames = []
    crowd_positions = [(200, 250), (250, 300), (300, 280), (350, 320), (500, 290),
                       (550, 260), (600, 310), (650, 280)]
    for f in range(frame_count):
        dets = []
        for i, (cx, cy) in enumerate(crowd_positions):
            wobble = math.sin(f * 0.05 + i * 0.7) * 3
            dets.append(Detection(
                track_id=i + 2,
                bbox=BBox(int(cx + wobble - 12), int(cy + wobble - 35),
                          int(cx + wobble + 12), int(cy + wobble + 5)),
            ))
        rx = 50 + f * 12
        ry = 280 + 20 * math.sin(f * 0.3)
        dets.append(Detection(
            track_id=1,
            bbox=BBox(int(rx - 15), int(ry - 40), int(rx + 15), int(ry + 10)),
        ))
        frames.append(dets)
    return frames, "Personne qui court dans la foule -- Devrait generer HIGH"

def gen_scatter(frame_count=20):
    """Dispersion soudaine (panique) -- HIGH alerts."""
    frames = []
    npc = 6
    for f in range(frame_count):
        dets = []
        for i in range(npc):
            angle = (i / npc) * 2 * math.pi
            if f < 5:
                radius = 40
            else:
                radius = 40 + (f - 5) * 25 + i * 5
            cx = 400 + radius * math.cos(angle)
            cy = 300 + radius * math.sin(angle) * 0.6
            dets.append(Detection(
                track_id=i + 1,
                bbox=BBox(int(cx - 12), int(cy - 35), int(cx + 12), int(cy + 5)),
            ))
        frames.append(dets)
    return frames, "Dispersion (panique) -- pics de veloce + proximite"

# ---------------------------------------------------------------------------
# 7.  AFFICHAGE CONSOLE
# ---------------------------------------------------------------------------

def colored_tier(tier):
    c = TIER_COLORS.get(tier, "")
    return f"{c}{TIER_NAMES.get(tier, tier)}{RESET}"

def severity_label(sev):
    if sev >= 3: return f"{BOLD}\033[91mDANGER{RESET}"
    if sev == 2: return f"\033[93mWARNING{RESET}"
    if sev == 1: return f"\033[94mWATCH{RESET}"
    return "OK"

def draw_risk_meter(score, width=20):
    """Dessine une barre de risque coloree."""
    filled = int(score * width)
    color = "\033[92m"
    if score > 0.45: color = "\033[91m"
    elif score > 0.32: color = "\033[93m"
    elif score > 0.20: color = "\033[94m"
    bar = color + "#" * filled + "\033[90m" + "-" * (width - filled) + RESET
    return bar

def draw_severity_meter(severity, max_sev=3):
    """Affiche le niveau de severite d'approche."""
    chars = [" ", ".", "+", "*"]
    sev_display = chars[min(severity, len(chars) - 1)]
    return f"{BOLD}{sev_display}{RESET}"

# ---------------------------------------------------------------------------
# 8.  EXECUTION D'UN SCENARIO
# ---------------------------------------------------------------------------

SCENARIOS = {
    "normal": gen_normal,
    "approach-slow": gen_approach_slow,
    "approach-fast": gen_approach_fast,
    "crowd": gen_crowd,
    "fight": gen_fight,
    "running": gen_running,
    "scatter": gen_scatter,
}

def run_scenario(name, show_all_frames=False):
    if name not in SCENARIOS:
        print(f"Scenario inconnu : {name}")
        return

    generator, description = SCENARIOS[name]()
    tracks = {}
    total_high = 0
    total_critical = 0
    worst_severity = 0
    frame_alerts = []

    print(f"\n{'='*70}")
    print(f"{BOLD}Scenario : {name}{RESET}")
    print(f"Description : {description}")
    print(f"Frames : {len(generator)}{'='*70}\n")

    prev_centroids = {}
    for frame_idx, detections in enumerate(generator):
        person_states, approach_pairs = compute_risk_scores(
            detections, tracks, frame_idx, prev_centroids
        )
        for det in detections:
            prev_centroids[det.track_id] = (det.bbox.cx, det.bbox.cy)

        unique_groups = set()
        for p in person_states:
            if p.group_id >= 0:
                unique_groups.add(p.group_id)

        tiers = [p.risk_tier for p in person_states]
        high_count = sum(1 for t in tiers if t in ("high", "critical"))
        crit_count = sum(1 for t in tiers if t == "critical")
        max_risk = max((p.risk_score for p in person_states), default=0.0)
        max_sev = max((a["severity"] for a in approach_pairs), default=0)
        group_count = len(unique_groups)

        if high_count > 0 or max_sev > 0 or group_count > 0:
            total_high += high_count
            total_critical += crit_count
            if max_sev > worst_severity: worst_severity = max_sev

            frame_info = {
                "frame": frame_idx,
                "persons": len(person_states),
                "high": high_count,
                "critical": crit_count,
                "max_risk": max_risk,
                "max_sev": max_sev,
                "approach_pairs": len(approach_pairs),
                "groups": group_count,
            }
            frame_alerts.append(frame_info)

        if show_all_frames or len(frame_alerts) <= 5 or frame_idx >= len(generator) - 3:
            risk_bar = draw_risk_meter(max_risk)
            sev_meter = draw_severity_meter(max_sev)
            tier_str = colored_tier("critical") if crit_count > 0 else \
                       colored_tier("high") if high_count > 0 else ""

            line = (f"f{frame_idx:3d} | {risk_bar} {max_risk:.2f} "
                    f"| {tier_str} H:{high_count} C:{crit_count} "
                    f"{sev_meter} approche:{max_sev}")
            if approach_pairs:
                top_a = approach_pairs[0]
                line += f" TTC:{top_a['ttc']:.1f}s dist:{top_a['dist']:.0f}px"
            if group_count > 0:
                line += f" groupes:{group_count}"
            print(line)

    severity_labels = {1: "WATCH", 2: "WARNING", 3: "DANGER"}
    print(f"\n{'-'*70}")
    print(f"{BOLD}Resume du scenario :{RESET}")
    print(f"  Total frames          : {len(generator)}")
    print(f"  Frames avec risque    : {len(frame_alerts)}")
    print(f"  Total HIGH            : {total_high}")
    print(f"  Total CRITICAL        : {total_critical}")
    print(f"  Pire approche         : {severity_labels.get(worst_severity, 'AUCUNE')}")
    print(f"{'-'*70}\n")

    return {
        "name": name,
        "frames": len(generator),
        "alert_frames": len(frame_alerts),
        "high_count": total_high,
        "critical_count": total_critical,
        "max_approach_sev": worst_severity,
    }

# ---------------------------------------------------------------------------
# 9.  COMPARAISON DE CONFIGURATIONS
# ---------------------------------------------------------------------------

def test_configurations():
    """Teste plusieurs configurations de poids pour trouver le meilleur reglage."""
    configs = [
        {"name": "Defaut (equilibre)", "wv": 0.40, "wa": 0.25, "wp": 0.15, "wo": 0.20},
        {"name": "Oriente vitesse",   "wv": 0.55, "wa": 0.25, "wp": 0.10, "wo": 0.10},
        {"name": "Oriente acceleration","wv": 0.25, "wa": 0.50, "wp": 0.15, "wo": 0.10},
        {"name": "Oriente proximite", "wv": 0.25, "wa": 0.20, "wp": 0.40, "wo": 0.15},
        {"name": "Oriente objet",     "wv": 0.25, "wa": 0.20, "wp": 0.15, "wo": 0.40},
    ]

    print(f"\n{'='*70}")
    print(f"{BOLD}COMPARAISON DES CONFIGURATIONS DE POIDS{RESET}")
    print(f"{'='*70}\n")

    results = []
    for cfg in configs:
        global WEIGHT_VELOCITY, WEIGHT_ACCEL, WEIGHT_PROXIMITY, WEIGHT_OBJECT
        WEIGHT_VELOCITY = cfg["wv"]
        WEIGHT_ACCEL = cfg["wa"]
        WEIGHT_PROXIMITY = cfg["wp"]
        WEIGHT_OBJECT = cfg["wo"]

        print(f"{BOLD}> {cfg['name']}{RESET} (v:{cfg['wv']} a:{cfg['wa']} p:{cfg['wp']} o:{cfg['wo']})")
        print(f"{'-'*50}")
        summary = run_scenario("approach-fast", show_all_frames=False)
        results.append((cfg["name"], summary))

    # Restore defaults
    WEIGHT_VELOCITY = 0.40
    WEIGHT_ACCEL = 0.25
    WEIGHT_PROXIMITY = 0.15
    WEIGHT_OBJECT = 0.20

    print(f"\n{'='*70}")
    print(f"{BOLD}TABLEAU COMPARATIF (scenario approach-fast){RESET}")
    print(f"{'-'*70}")
    print(f"{'Configuration':<25} {'Frames':>6} {'Alertes':>7} {'HIGH':>5} {'CRIT':>5} {'Niveau':>12}")
    print(f"{'-'*70}")
    for name, s in results:
        sev_labels = {0: "OK", 1: "WATCH", 2: "WARN", 3: "DANGER"}
        sev = sev_labels.get(s["max_approach_sev"], "?")
        print(f"{name:<25} {s['frames']:>6} {s['alert_frames']:>7} {s['high_count']:>5} {s['critical_count']:>5} {sev:>12}")
    print(f"{'-'*70}\n")

# ---------------------------------------------------------------------------
# 10. POINT D'ENTREE
# ---------------------------------------------------------------------------

def list_scenarios():
    print(f"\n{BOLD}Scenarios de test disponibles :{RESET}\n")
    for name, gen in sorted(SCENARIOS.items()):
        _, desc = gen()
        print(f"  {name:<16} -> {desc}")
    print()

def main():
    parser = argparse.ArgumentParser(
        description="Atlas Crowd Shield -- Test interactif de detection de conflits"
    )
    parser.add_argument("--scenario", "-s", default="all",
                        help="Scenario a executer (defaut: all)")
    parser.add_argument("--list", "-l", action="store_true",
                        help="Lister les scenarios disponibles")
    parser.add_argument("--all-frames", "-a", action="store_true",
                        help="Afficher toutes les frames (pas seulement les alertes)")
    parser.add_argument("--compare", "-c", action="store_true",
                        help="Comparer differentes configurations de poids")
    parser.add_argument("--slow", action="store_true",
                        help="Ralentir l'execution (100ms par frame)")
    args = parser.parse_args()

    if args.list:
        list_scenarios()
        return

    print()
    print(f"{BOLD}{'='*70}{RESET}")
    print(f"{BOLD}   ATLAS CROWD SHIELD -- TEST DE DETECTION DE CONFLITS{RESET}")
    print(f"{BOLD}{'='*70}{RESET}")

    if args.compare:
        test_configurations()
        return

    if args.scenario == "all":
        summaries = []
        for name in SCENARIOS:
            result = run_scenario(name, show_all_frames=args.all_frames)
            summaries.append(result)
            if args.slow:
                time.sleep(0.5)

        print(f"\n{'='*70}")
        print(f"{BOLD}RESUME GLOBAL{RESET}")
        print(f"{'-'*70}")
        print(f"{'Scenario':<20} {'Frames':>6} {'Alertes':>7} {'HIGH':>5} {'CRIT':>5} {'Approche':>10}")
        print(f"{'-'*70}")
        for s in summaries:
            sev_labels = {0: "OK", 1: "WATCH", 2: "WARN", 3: "DANGER"}
            sev = sev_labels.get(s["max_approach_sev"], "?")
            print(f"{s['name']:<20} {s['frames']:>6} {s['alert_frames']:>7} "
                  f"{s['high_count']:>5} {s['critical_count']:>5} {sev:>10}")
        print(f"{'-'*70}\n")
    else:
        run_scenario(args.scenario, show_all_frames=args.all_frames)

    print(f"\n{BOLD}[OK] Test termine.{RESET} Utilisez --compare pour tester differentes configs.\n")

if __name__ == "__main__":
    main()
