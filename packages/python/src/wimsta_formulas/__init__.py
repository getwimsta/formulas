"""wimsta-formulas — the WIMSTA Formula Registry as code.

Computes single formulas from https://wimsta.com/registry/. It does not combine
formulas into a range: for that use the API, https://wimsta.com/api/calc.
Estimates for general information only, not medical advice.
"""
from __future__ import annotations

import json
from importlib.resources import files
from typing import Any, Dict, List, Optional

from . import formulas as F

__all__ = ["registry", "REGISTRY_VERSION", "vectors", "get_formula", "list_formulas", "calculate", "FormulaInputError"]
__version__ = "1.0.1"

_data = files(__package__) / "data"
registry: Dict[str, Any] = json.loads((_data / "registry.json").read_text(encoding="utf-8"))
vectors: Dict[str, Any] = json.loads((_data / "vectors.json").read_text(encoding="utf-8"))
_BOUNDS: Dict[str, Dict[str, float]] = json.loads((_data / "bounds.json").read_text(encoding="utf-8"))
REGISTRY_VERSION: str = registry["registry_version"]


class FormulaInputError(ValueError):
    pass


def get_formula(id: str) -> Optional[Dict[str, Any]]:
    return next((f for f in registry["formulas"] if f["id"] == id), None)


def list_formulas(category: Optional[str] = None) -> List[Dict[str, Any]]:
    return [f for f in registry["formulas"] if category is None or f["category"] == category]


def _needs(id: str, sex: Optional[str]) -> List[str]:
    male = sex == "male"
    return {
        "deurenberg": ["sex", "age", "height_cm", "weight_kg"],
        "cun-bae": ["sex", "age", "height_cm", "weight_kg"],
        "us-navy": ["sex", "height_cm", "neck_cm", "abdomen_cm"] if male else ["sex", "height_cm", "neck_cm", "waist_cm", "hip_cm"],
        "rfm": ["sex", "height_cm", "waist_cm"],
        "covert-bailey": (["sex", "age", "wrist_cm", "waist_cm", "hip_cm", "forearm_cm"] if male
                          else ["sex", "age", "wrist_cm", "hip_cm", "thigh_cm", "calf_cm"]),
        "gallagher-ranges": ["sex", "age"],
        "who-bmi": ["weight_kg", "height_cm"],
        "trefethen-bmi": ["weight_kg", "height_cm"],
        "ashwell-whtr": ["waist_cm", "height_cm"],
        "tanaka": ["age"],
        "gulati": ["sex", "age"],
        "fox": ["age"],
        "harris-benedict-1919": ["sex", "age", "height_cm", "weight_kg"],
        "harris-benedict-1984": ["sex", "age", "height_cm", "weight_kg"],
        "katch-mcardle": ["weight_kg", "body_fat_pct"],
        "mifflin-st-jeor": ["sex", "age", "height_cm", "weight_kg"],
        "nes": ["age"],
        "londeree": ["age"],
        "inbar": ["age"],
        "devine": ["sex", "height_cm"],
        "robinson": ["sex", "height_cm"],
        "miller-ideal-weight": ["sex", "height_cm"],
        "peterson": ["height_cm"],
        "mosteller": ["height_cm", "weight_kg"],
        "du-bois": ["height_cm", "weight_kg"],
        "haycock": ["height_cm", "weight_kg"],
    }[id]


_UNIT = {"body-fat": "%", "body-fat-ranges": "%", "bmi": "kg/m²", "waist-to-height": "ratio",
         "max-heart-rate": "bpm", "bmr": "kcal/day", "ideal-weight": "kg", "bsa": "m²"}


def calculate(id: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Compute one registry formula. Inputs use the /api/calc names (sex, age, height_cm, weight_kg, ...)."""
    entry = get_formula(id)
    if entry is None:
        raise FormulaInputError(f'unknown formula id "{id}"')
    for k in _needs(id, inputs.get("sex")):
        v = inputs.get(k)
        if v is None:
            raise FormulaInputError(f'{id}: missing input "{k}"')
        if k == "sex":
            if v not in ("female", "male"):
                raise FormulaInputError(f'{id}: sex must be "female" or "male"')
            continue
        b = _BOUNDS[k]
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not (b["min"] <= v <= b["max"]):
            raise FormulaInputError(f"{id}: {k} must be a number from {b['min']} to {b['max']}")
    sex = inputs.get("sex") or "female"
    m = {
        "sex": sex, "age": inputs.get("age"), "height": inputs.get("height_cm"), "weight": inputs.get("weight_kg"),
        "waist": inputs.get("waist_cm"), "abdomen": inputs.get("abdomen_cm"), "neck": inputs.get("neck_cm"),
        "hip": inputs.get("hip_cm"), "wrist": inputs.get("wrist_cm"), "forearm": inputs.get("forearm_cm"),
        "thigh": inputs.get("thigh_cm"), "calf": inputs.get("calf_cm"), "bodyFat": inputs.get("body_fat_pct"),
    }
    fn = {
        "deurenberg": lambda: F.deurenberg(m),
        "cun-bae": lambda: F.cun_bae(m),
        "us-navy": lambda: F.us_navy(m),
        "rfm": lambda: F.rfm(m),
        "covert-bailey": lambda: F.covert_bailey(m),
        "gallagher-ranges": lambda: F.gallagher_ranges(m["age"], sex),
        "who-bmi": lambda: F.who_bmi(m["weight"], m["height"]),
        "trefethen-bmi": lambda: F.trefethen_bmi(m["weight"], m["height"]),
        "ashwell-whtr": lambda: F.ashwell_whtr(m["waist"], m["height"]),
        "tanaka": lambda: F.tanaka(m["age"]),
        "gulati": lambda: F.gulati(m["age"], sex),
        "fox": lambda: F.fox(m["age"]),
        "harris-benedict-1919": lambda: F.harris_benedict_1919(m),
        "harris-benedict-1984": lambda: F.harris_benedict_1984(m),
        "katch-mcardle": lambda: F.katch_mcardle(m),
        "mifflin-st-jeor": lambda: F.mifflin_st_jeor(m),
        "nes": lambda: F.nes(m["age"]),
        "londeree": lambda: F.londeree(m["age"]),
        "inbar": lambda: F.inbar(m["age"]),
        "devine": lambda: F.devine(m["height"], sex),
        "robinson": lambda: F.robinson(m["height"], sex),
        "miller-ideal-weight": lambda: F.miller_ideal_weight(m["height"], sex),
        "peterson": lambda: F.peterson(m["height"]),
        "mosteller": lambda: F.mosteller(m["height"], m["weight"]),
        "du-bois": lambda: F.du_bois(m["height"], m["weight"]),
        "haycock": lambda: F.haycock(m["height"], m["weight"]),
    }[id]
    value = fn()
    if value is None:
        if id == "gulati":
            raise FormulaInputError('gulati: derived in women only; not defined for sex "male"')
        raise FormulaInputError(f"{id}: the equation is undefined for these inputs")
    return {
        "value": value,
        "unit": _UNIT[entry["category"]],
        "formula": {"id": entry["id"], "name": entry["name"], "source": entry["source"],
                    "canonical_page": entry.get("canonical_page") or registry["canonical_page"]},
    }
