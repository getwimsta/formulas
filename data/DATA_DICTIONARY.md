# Data dictionary — `registry.json`

`registry.json` is a copy of https://wimsta.com/api/registry.json. Licence: CC BY 4.0.

## Top level

| Field | Type | Meaning |
|---|---|---|
| `registry_version` | string `YYYY.MM.DD`, optionally `.N` for a second release on the same day | Version of the registry data. Also exported by the packages as `REGISTRY_VERSION`. |
| `last_updated` | date | Date of the last change to any entry. |
| `license` | string | `CC-BY-4.0`. |
| `attribution_notice` | string | The attribution line to show with the data. |
| `canonical_page` | URL | https://wimsta.com/registry/ |
| `formula_count` | integer | Number of entries in `formulas`. |
| `formulas` | array | One record per formula (below). |

## Formula record

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable identifier (kebab-case). Used by `calculate(id, …)` and by `registry_id` in `/api/calc` answers. Never reused. |
| `name` | string | Display name. |
| `category` | string | `body-fat`, `body-fat-ranges`, `bmi`, `waist-to-height`, `max-heart-rate`, `bmr`, `ideal-weight` or `bsa`. |
| `equation` | string | The equation in plain text, with units. |
| `inputs` | string[] | Inputs the equation needs; sex-specific inputs are marked. |
| `source.authors`, `source.year`, `source.journal` | string, integer, string | Primary publication. |
| `source.doi` | URL | Link to the primary source: a `https://doi.org/…` DOI where one exists, otherwise the publisher's URL. Absent when the source has neither. |
| `sample` | object | Derivation sample: `population`, `reference_method`, `n` where reported. |
| `error` | object | Reported error: `note` (text), `value`, `unit` (`pp` = percentage points, `bpm`, `kcal/day` …). |
| `verification` | string | `primary` — checked against the primary publication; `secondary` — only secondary sources available. |
| `independent_derivation` | boolean | `false` only when the entry would move in lockstep with another entry: same inputs and shared data, or an algebraic restatement (e.g. Peterson = weight at BMI 22). Otherwise `true`. |
| `limitations` | string[] | Known limits of validity. |
| `canonical_page` | URL | WIMSTA page about the formula. Absent when the formula has no page of its own (then use the top-level `canonical_page`). |
| `coefficients` | object | Numeric coefficients, by sex where the equation differs. |
| `sex_coding` | string | How sex enters the equation (e.g. `male=1, female=0`, separate equations). |
| `units` | string | `metric` or `imperial` — the units the published equation is written in. The packages always take metric inputs and convert internally. |

## `vectors.json`

| Field | Meaning |
|---|---|
| `formula_id` | Registry `id`. |
| `inputs` | Inputs in `/api/calc` names and metric units. |
| `value` | Unrounded result of the reference implementation (the module the WIMSTA site uses). Packages must match within `tolerance` (1e-6). For `gallagher-ranges` an object `{healthy_low, healthy_high, overfat_high}`. |
| `unit` | Unit of `value`. |
| `api_value` | `/api/calc` answer (from the URL in the root field `api`) for the same inputs, rounded as the site shows it; `null` where the API does not return this formula for these inputs. |
| `api_round_digits` | Decimal places of `api_value`. |
| `registry_version` | Registry version the vector was produced with. |
