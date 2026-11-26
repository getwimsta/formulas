/**
 * wimsta-formulas — the WIMSTA Formula Registry as code.
 *
 * Computes single formulas from the registry (https://wimsta.com/registry/).
 * It does not combine formulas into a range: for that use the API
 * (https://wimsta.com/api/calc). Estimates for general information only,
 * not medical advice.
 */
import * as F from './formulas.js';
import { registry, BOUNDS } from './data.js';
import vectorsData from './vectors.js';

export { registry };
export const REGISTRY_VERSION: string = registry.registry_version;
export const vectors = vectorsData;

export type Sex = 'female' | 'male';
import type { Entry } from './types.js';
export type { Entry, Registry } from './types.js';

/** Inputs use the same names and bounds as /api/calc. Metric units. */
export interface Inputs {
  sex?: Sex;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  waist_cm?: number;
  abdomen_cm?: number;
  neck_cm?: number;
  hip_cm?: number;
  wrist_cm?: number;
  forearm_cm?: number;
  thigh_cm?: number;
  calf_cm?: number;
  body_fat_pct?: number;
}

export interface GallagherRange {
  healthy_low: number;
  healthy_high: number;
  overfat_high: number;
}

export interface Result<V = number | GallagherRange> {
  value: V;
  unit: string;
  formula: { id: string; name: string; source: Entry['source']; canonical_page: string };
}

export class FormulaInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaInputError';
  }
}

export function getFormula(id: string): Entry | undefined {
  return registry.formulas.find((f) => f.id === id);
}

export function listFormulas(opts: { category?: string } = {}): Entry[] {
  return registry.formulas.filter((f) => !opts.category || f.category === opts.category);
}

/** Which inputs each formula needs (women/men differences for US Navy and Covert Bailey). */
const NEEDS: Record<string, (sex?: Sex) => (keyof Inputs)[]> = {
  'deurenberg': () => ['sex', 'age', 'height_cm', 'weight_kg'],
  'cun-bae': () => ['sex', 'age', 'height_cm', 'weight_kg'],
  'us-navy': (s) => (s === 'male' ? ['sex', 'height_cm', 'neck_cm', 'abdomen_cm'] : ['sex', 'height_cm', 'neck_cm', 'waist_cm', 'hip_cm']),
  'rfm': () => ['sex', 'height_cm', 'waist_cm'],
  'covert-bailey': (s) =>
    s === 'male' ? ['sex', 'age', 'wrist_cm', 'waist_cm', 'hip_cm', 'forearm_cm'] : ['sex', 'age', 'wrist_cm', 'hip_cm', 'thigh_cm', 'calf_cm'],
  'gallagher-ranges': () => ['sex', 'age'],
  'who-bmi': () => ['weight_kg', 'height_cm'],
  'trefethen-bmi': () => ['weight_kg', 'height_cm'],
  'ashwell-whtr': () => ['waist_cm', 'height_cm'],
  'tanaka': () => ['age'],
  'gulati': () => ['sex', 'age'],
  'fox': () => ['age'],
  'harris-benedict-1919': () => ['sex', 'age', 'height_cm', 'weight_kg'],
  'harris-benedict-1984': () => ['sex', 'age', 'height_cm', 'weight_kg'],
  'katch-mcardle': () => ['weight_kg', 'body_fat_pct'],
};

const UNIT: Record<string, string> = {
  'body-fat': '%',
  'body-fat-ranges': '%',
  'bmi': 'kg/m²',
  'waist-to-height': 'ratio',
  'max-heart-rate': 'bpm',
  'bmr': 'kcal/day',
};

function check(id: string, inputs: Inputs): void {
  const need = NEEDS[id](inputs.sex);
  for (const k of need) {
    const v = inputs[k];
    if (v === undefined || v === null) throw new FormulaInputError(`${id}: missing input "${k}"`);
    if (k === 'sex') {
      if (v !== 'female' && v !== 'male') throw new FormulaInputError(`${id}: sex must be "female" or "male"`);
      continue;
    }
    const b = BOUNDS[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < b.min || v > b.max)
      throw new FormulaInputError(`${id}: ${k} must be a number from ${b.min} to ${b.max}`);
  }
}

/** Compute one registry formula. Throws FormulaInputError on missing / out-of-range inputs. */
export function calculate(id: string, inputs: Inputs): Result {
  const entry = getFormula(id);
  if (!entry || !NEEDS[id]) throw new FormulaInputError(`unknown formula id "${id}"`);
  check(id, inputs);
  const sex = (inputs.sex ?? 'female') as Sex;
  const bf: F.BodyFatInputs = {
    sex,
    age: inputs.age,
    height: inputs.height_cm,
    weight: inputs.weight_kg,
    waist: inputs.waist_cm,
    abdomen: inputs.abdomen_cm,
    neck: inputs.neck_cm,
    hip: inputs.hip_cm,
    wrist: inputs.wrist_cm,
    forearm: inputs.forearm_cm,
    thigh: inputs.thigh_cm,
    calf: inputs.calf_cm,
  };
  const bmr: F.BmrInputs = { sex, weight: inputs.weight_kg ?? null, height: inputs.height_cm ?? null, age: inputs.age ?? null, bodyFat: inputs.body_fat_pct };
  let value: number | GallagherRange | null;
  switch (id) {
    case 'deurenberg': value = F.deurenberg(bf); break;
    case 'cun-bae': value = F.cunBae(bf); break;
    case 'us-navy': value = F.usNavy(bf); break;
    case 'rfm': value = F.rfm(bf); break;
    case 'covert-bailey': value = F.covertBailey(bf); break;
    case 'gallagher-ranges': {
      const r = F.gallagherRanges(inputs.age!, sex);
      value = { healthy_low: r.healthyLow, healthy_high: r.healthyHigh, overfat_high: r.overfatHigh };
      break;
    }
    case 'who-bmi': value = F.whoBmi(inputs.weight_kg!, inputs.height_cm!); break;
    case 'trefethen-bmi': value = F.trefethenBmi(inputs.weight_kg!, inputs.height_cm!); break;
    case 'ashwell-whtr': value = F.ashwellWhtr(inputs.waist_cm!, inputs.height_cm!); break;
    case 'tanaka': value = F.tanaka(inputs.age!); break;
    case 'gulati':
      value = F.gulati(inputs.age!, sex);
      if (value === null) throw new FormulaInputError('gulati: derived in women only; not defined for sex "male"');
      break;
    case 'fox': value = F.fox(inputs.age!); break;
    case 'harris-benedict-1919': value = F.harrisBenedict1919(bmr); break;
    case 'harris-benedict-1984': value = F.harrisBenedict1984(bmr); break;
    case 'katch-mcardle': value = F.katchMcArdle(bmr); break;
    default: throw new FormulaInputError(`unknown formula id "${id}"`);
  }
  if (value === null) throw new FormulaInputError(`${id}: the equation is undefined for these inputs`);
  return {
    value,
    unit: UNIT[entry.category],
    formula: { id: entry.id, name: entry.name, source: entry.source, canonical_page: entry.canonical_page ?? registry.canonical_page },
  };
}
