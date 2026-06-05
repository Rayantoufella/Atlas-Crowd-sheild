def estimate_density(person_count, max_persons=20):
    ratio = person_count / max_persons
    if ratio >= 0.6:
        return "high"
    if ratio >= 0.35:
        return "medium"
    return "low"
