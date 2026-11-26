"""Registry equations — a line-by-line port of src/lib/formulas/registry-formulas.ts
on wimsta.com. The test vectors (data/vectors.json) are the only guard against drift:
the package is not released unless every vector matches within 1e-6."""
from __future__ import annotations

import math
from typing import Optional

IN_PER_CM = 0.393701


def _ok(v: Optional[float]) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and v > 0


def who_bmi(weight: float, height: float) -> float:
    return weight / (height / 100) ** 2


def trefethen_bmi(weight: float, height: float) -> float:
    return (1.3 * weight) / (height / 100) ** 2.5


def ashwell_whtr(waist: float, height: float) -> float:
    return waist / height


def _bmi(m: dict) -> Optional[float]:
    h, w = m.get("height"), m.get("weight")
    return who_bmi(w, h) if _ok(h) and _ok(w) else None


def deurenberg(m: dict) -> Optional[float]:
    bmi, age = _bmi(m), m.get("age")
    if bmi is None or not _ok(age):
        return None
    return 1.2 * bmi + 0.23 * age - 10.8 * (1 if m["sex"] == "male" else 0) - 5.4


def cun_bae(m: dict) -> Optional[float]:
    bmi, age = _bmi(m), m.get("age")
    if bmi is None or not _ok(age):
        return None
    female = 0 if m["sex"] == "male" else 1
    return (
        -44.988
        + 0.503 * age
        + 10.689 * female
        + 3.172 * bmi
        - 0.026 * bmi**2
        + 0.181 * bmi * female
        - 0.02 * bmi * age
        - 0.005 * bmi**2 * female
        + 0.00021 * bmi**2 * age
    )


def us_navy(m: dict) -> Optional[float]:
    neck, h = m.get("neck"), m.get("height")
    if not _ok(neck) or not _ok(h):
        return None
    if m["sex"] == "male":
        ab = m.get("abdomen")
        if not _ok(ab):
            return None
        arg = ab - neck
        if arg <= 0:
            return None
        denom = 1.0324 - 0.19077 * math.log10(arg) + 0.15456 * math.log10(h)
    else:
        waist, hip = m.get("waist"), m.get("hip")
        if not _ok(waist) or not _ok(hip):
            return None
        arg = waist + hip - neck
        if arg <= 0:
            return None
        denom = 1.29579 - 0.35004 * math.log10(arg) + 0.221 * math.log10(h)
    if denom == 0:
        return None
    return 495 / denom - 450


def rfm(m: dict) -> Optional[float]:
    h, waist = m.get("height"), m.get("waist")
    if not _ok(h) or not _ok(waist):
        return None
    return (64 if m["sex"] == "male" else 76) - 20 * (h / waist)


def covert_bailey(m: dict) -> Optional[float]:
    age, wrist = m.get("age"), m.get("wrist")
    if not _ok(age) or not _ok(wrist):
        return None
    wrist_in = wrist * IN_PER_CM
    waist_in = m["waist"] * IN_PER_CM if _ok(m.get("waist")) else None
    hip_in = m["hip"] * IN_PER_CM if _ok(m.get("hip")) else None
    if m["sex"] == "male":
        forearm_in = m["forearm"] * IN_PER_CM if _ok(m.get("forearm")) else None
        if waist_in is None or hip_in is None or forearm_in is None:
            return None
        coef = 3 if age <= 30 else 2.7
        return waist_in + 0.5 * hip_in - coef * forearm_in - wrist_in
    thigh_in = m["thigh"] * IN_PER_CM if _ok(m.get("thigh")) else None
    calf_in = m["calf"] * IN_PER_CM if _ok(m.get("calf")) else None
    if hip_in is None or thigh_in is None or calf_in is None:
        return None
    coef = 0.8 if age <= 30 else 1.0
    return hip_in + coef * thigh_in - 2 * calf_in - wrist_in


_GALLAGHER = {
    "female": [(21, 33, 39), (23, 34, 40), (24, 36, 42)],
    "male": [(8, 20, 25), (11, 22, 28), (13, 25, 30)],
}


def gallagher_ranges(age: Optional[float], sex: str) -> dict:
    band = 0 if not isinstance(age, (int, float)) else (0 if age < 40 else 1 if age < 60 else 2)
    lo, hi, over = _GALLAGHER["male" if sex == "male" else "female"][band]
    return {"healthy_low": lo, "healthy_high": hi, "overfat_high": over}


def tanaka(age: float) -> float:
    return 208 - 0.7 * age


def gulati(age: float, sex: str) -> Optional[float]:
    return None if sex == "male" else 206 - 0.88 * age


def fox(age: float) -> float:
    return 220 - age


def harris_benedict_1919(m: dict) -> Optional[float]:
    w, h, a = m.get("weight"), m.get("height"), m.get("age")
    if not (_ok(w) and _ok(h) and _ok(a)):
        return None
    if m["sex"] == "male":
        return 66.473 + 13.7516 * w + 5.0033 * h - 6.755 * a
    return 655.0955 + 9.5634 * w + 1.8496 * h - 4.6756 * a


def harris_benedict_1984(m: dict) -> Optional[float]:
    w, h, a = m.get("weight"), m.get("height"), m.get("age")
    if not (_ok(w) and _ok(h) and _ok(a)):
        return None
    if m["sex"] == "male":
        return 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
    return 447.593 + 9.247 * w + 3.098 * h - 4.33 * a


def katch_mcardle(m: dict) -> Optional[float]:
    w, bf = m.get("weight"), m.get("bodyFat")
    if not _ok(w) or not _ok(bf) or bf >= 100:
        return None
    lean = w * (1 - bf / 100)
    return 370 + 21.6 * lean
