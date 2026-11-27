# WIMSTA Formula Registry

Open registry of published body-composition and energy-expenditure equations — body fat, healthy body-fat ranges, BMI, waist-to-height ratio, maximum heart rate and basal metabolic rate — each with its primary source, coefficients, inputs, sex coding, units, reported error and limitations. Human-readable pages: **https://wimsta.com/registry/**.

<!-- meta:start -->
Registry version **2026.11.27.1** · 26 formulas · 254 test vectors · packages 1.0.0
<!-- meta:end -->

The same data is served live at [`/api/registry.json`](https://wimsta.com/api/registry.json); this repository is a versioned, citable copy plus small packages for JavaScript and Python. Nothing here is edited by hand: `scripts/export.mjs` pulls the registry, `scripts/make-vectors.mjs` rebuilds the test vectors.

## Formulas

<!-- table:start -->
| id | Name | Category | Source | DOI / source | WIMSTA page |
|---|---|---|---|---|---|
| `deurenberg` | Deurenberg | body-fat | Deurenberg, Weststrate & Seidell 1991 | [10.1079/BJN19910073](https://doi.org/10.1079/BJN19910073) | [page](https://wimsta.com/deurenberg-formula/) |
| `cun-bae` | CUN-BAE | body-fat | Gómez-Ambrosi et al. 2012 | [10.2337/dc11-1334](https://doi.org/10.2337/dc11-1334) | [page](https://wimsta.com/cun-bae-calculator/) |
| `us-navy` | US Navy (Hodgdon–Beckett) | body-fat | Hodgdon & Beckett 1984 | — | [page](https://wimsta.com/us-navy-body-fat-formula/) |
| `rfm` | RFM (Relative Fat Mass) | body-fat | Woolcott & Bergman 2018 | [10.1038/s41598-018-29362-1](https://doi.org/10.1038/s41598-018-29362-1) | [page](https://wimsta.com/rfm-calculator/) |
| `covert-bailey` | Covert Bailey | body-fat | Covert Bailey 1999 | — | [registry](https://wimsta.com/registry/) |
| `gallagher-ranges` | Gallagher healthy ranges | body-fat-ranges | Gallagher et al. 2000 | [10.1093/ajcn/72.3.694](https://doi.org/10.1093/ajcn/72.3.694) | [registry](https://wimsta.com/registry/) |
| `who-bmi` | WHO BMI cut-points | bmi | World Health Organization 2000 | [link](https://www.who.int/publications/i/item/WHO_TRS_894) | [page](https://wimsta.com/bmi-categories/) |
| `trefethen-bmi` | Trefethen “new BMI” | bmi | Nick Trefethen (Oxford) 2013 | [link](https://people.maths.ox.ac.uk/trefethen/bmi.html) | [page](https://wimsta.com/new-bmi-formula/) |
| `ashwell-whtr` | Ashwell boundary | waist-to-height | Ashwell & Gibson 2016 | [10.1136/bmjopen-2015-010159](https://doi.org/10.1136/bmjopen-2015-010159) | [registry](https://wimsta.com/registry/) |
| `tanaka` | Tanaka | max-heart-rate | Tanaka, Monahan & Seals 2001 | [10.1016/S0735-1097(00)01054-8](https://doi.org/10.1016/S0735-1097(00)01054-8) | [page](https://wimsta.com/tanaka-formula/) |
| `gulati` | Gulati | max-heart-rate | Gulati et al. 2010 | [10.1161/CIRCULATIONAHA.110.939249](https://doi.org/10.1161/CIRCULATIONAHA.110.939249) | [page](https://wimsta.com/max-heart-rate-women/) |
| `fox` | Fox (220 − age) | max-heart-rate | Fox, Naughton & Haskell 1971 | — | [page](https://wimsta.com/220-minus-age/) |
| `nes` | Nes (HUNT) | max-heart-rate | Nes, Janszky, Wisløff, Støylen & Karlsen 2013 | [10.1111/j.1600-0838.2012.01445.x](https://doi.org/10.1111/j.1600-0838.2012.01445.x) | [page](https://wimsta.com/target-heart-rate-calculator/) |
| `londeree` | Londeree & Moeschberger | max-heart-rate | Londeree & Moeschberger 1982 | [10.1080/02701367.1982.10605252](https://doi.org/10.1080/02701367.1982.10605252) | [page](https://wimsta.com/target-heart-rate-calculator/) |
| `inbar` | Inbar | max-heart-rate | Inbar, Oren, Scheinowitz, Rotstein, Dlin & Casaburi 1994 | [10.1249/00005768-199405000-00003](https://doi.org/10.1249/00005768-199405000-00003) | [page](https://wimsta.com/target-heart-rate-calculator/) |
| `mifflin-st-jeor` | Mifflin–St Jeor | bmr | Mifflin, St Jeor, Hill, Scott, Daugherty & Koh 1990 | [10.1093/ajcn/51.2.241](https://doi.org/10.1093/ajcn/51.2.241) | [page](https://wimsta.com/formulas/mifflin-st-jeor/) |
| `harris-benedict-1919` | Harris–Benedict | bmr | Harris & Benedict 1919 | — | [page](https://wimsta.com/harris-benedict-calculator/) |
| `harris-benedict-1984` | Harris–Benedict revised | bmr | Roza & Shizgal 1984 | [10.1093/ajcn/40.1.168](https://doi.org/10.1093/ajcn/40.1.168) | [page](https://wimsta.com/harris-benedict-calculator/) |
| `katch-mcardle` | Katch–McArdle (Cunningham 1991) | bmr | Cunningham (popularised by Katch & McArdle) 1991 | [10.1093/ajcn/54.6.963](https://doi.org/10.1093/ajcn/54.6.963) | [page](https://wimsta.com/katch-mcardle-calculator/) |
| `devine` | Devine | ideal-weight | Devine (in McCarron & Devine) 1974 | [10.1177/106002807400801104](https://doi.org/10.1177/106002807400801104) | [page](https://wimsta.com/ideal-weight-calculator/) |
| `robinson` | Robinson | ideal-weight | Robinson, Lupkiewicz, Palenik, Lopez & Ariet 1983 | [10.1093/ajhp/40.6.1016](https://doi.org/10.1093/ajhp/40.6.1016) | [page](https://wimsta.com/ideal-weight-calculator/) |
| `miller-ideal-weight` | Miller (ideal body weight) | ideal-weight | Miller, Carlson, Lloyd & Day 1983 | [10.1093/ajhp/40.10.1622a](https://doi.org/10.1093/ajhp/40.10.1622a) | [page](https://wimsta.com/ideal-weight-calculator/) |
| `peterson` | Peterson (BMI-universal) | ideal-weight | Peterson, Thomas, Blackburn & Heymsfield 2016 | [10.3945/ajcn.115.121178](https://doi.org/10.3945/ajcn.115.121178) | [page](https://wimsta.com/ideal-weight-calculator/) |
| `mosteller` | Mosteller | bsa | Mosteller 1987 | [10.1056/NEJM198710223171717](https://doi.org/10.1056/NEJM198710223171717) | [page](https://wimsta.com/bsa-calculator/) |
| `du-bois` | Du Bois | bsa | Du Bois & Du Bois 1916 | [10.1001/archinte.1916.00080130010002](https://doi.org/10.1001/archinte.1916.00080130010002) | [page](https://wimsta.com/bsa-calculator/) |
| `haycock` | Haycock | bsa | Haycock, Schwartz & Wisotsky 1978 | [10.1016/S0022-3476(78)80601-5](https://doi.org/10.1016/S0022-3476(78)80601-5) | [page](https://wimsta.com/bsa-calculator/) |
<!-- table:end -->

Field-by-field description: [`data/DATA_DICTIONARY.md`](data/DATA_DICTIONARY.md).

## Install

```sh
npm i wimsta-formulas
pip install wimsta-formulas
```

JavaScript / TypeScript (ESM and CommonJS, types included, no dependencies):

```js
import { calculate, listFormulas, REGISTRY_VERSION } from 'wimsta-formulas';

const r = calculate('who-bmi', { weight_kg: 62, height_cm: 165 });
// r.value → 22.77318640955005, r.unit → 'kg/m²'
// r.formula.canonical_page → 'https://wimsta.com/bmi-categories/'
```

Python 3.10+ (no dependencies, typed):

```python
from wimsta_formulas import calculate

r = calculate("who-bmi", {"weight_kg": 62, "height_cm": 165})
r["value"]  # 22.77318640955005
```

Inputs use the same names, metric units and bounds as the WIMSTA API (`sex`, `age` 18–100, `height_cm` 100–250, `weight_kg` 20–350, `waist_cm`, `abdomen_cm`, `neck_cm`, `hip_cm`, `wrist_cm`, `forearm_cm`, `thigh_cm`, `calf_cm`, `body_fat_pct`). Missing or out-of-range inputs raise `FormulaInputError`. Every result carries `formula.source` and `formula.canonical_page`, so whoever shows the number can link to the formula page.

## Need a range across several formulas? Use the API

The packages compute **one formula at a time** and return the unrounded value. Combining formulas into an honest range, deciding which formulas apply to which inputs, and categories are done by the calculation API: [`https://wimsta.com/api/calc`](https://wimsta.com/api/calc) (OpenAPI: [`/api/openapi.json`](https://wimsta.com/api/openapi.json)). The API rounds as the site displays (body fat and BMI to 0.1, BMR, heart rate and ideal weight to whole numbers, body surface area to 0.01 m²).

## Test vectors

[`data/vectors.json`](data/vectors.json): 10 profiles (5 per sex, including the API's boundary values) × every applicable formula. `value` is the unrounded result of the reference implementation; `api_value` is the live `/api/calc` answer for the same inputs, and the vectors are only written when `value` rounded the API's way equals `api_value`. Both packages must reproduce every `value` within 1e-6 before release.

## How to cite

<!-- cite:start -->
WIMSTA (2026). *WIMSTA Formula Registry* (version 2026.11.27.1) [Data set]. https://wimsta.com/registry/

```bibtex
@dataset{wimsta_formula_registry,
  author    = {{WIMSTA}},
  title     = {WIMSTA Formula Registry: body-composition and energy-expenditure equations with primary sources},
  year      = {2026},
  version   = {2026.11.27.1},
  url       = {https://wimsta.com/registry/},
  publisher = {Zenodo}
}
```
<!-- cite:end -->

## Licence

- Data (`data/`, and the data inside the packages): [CC BY 4.0](LICENSE-DATA). Attribution: “Data from WIMSTA (wimsta.com), licensed CC BY 4.0”, with a link to https://wimsta.com/registry/.
- Code (`packages/`, `scripts/`): [Apache-2.0](LICENSE-CODE), see [NOTICE](NOTICE).

## Disclaimer

Estimates for general information only. Not a diagnosis and not medical advice.

---

## En español

Registro abierto de ecuaciones publicadas de composición corporal y gasto energético (grasa corporal, rangos saludables, IMC, cintura/altura, frecuencia cardiaca máxima y metabolismo basal), cada una con su fuente primaria. Páginas: **https://wimsta.com/es/registro/**. Los paquetes `wimsta-formulas` (npm y PyPI) calculan una fórmula cada vez; para un rango entre varias fórmulas, use la API: https://wimsta.com/api/calc. Datos bajo CC BY 4.0, código bajo Apache-2.0. Estimaciones con fines informativos; no es consejo médico.

Contact: hello@wimsta.com
