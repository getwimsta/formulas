/**
 * Registry formulas — one pure function per entry of /api/registry.json.
 *
 * This file is the single source of the equations: the site's calculators
 * (bmi.ts, bodyfat.ts, bodyfat-ranges.ts, bmr.ts, maxhr.ts, whtr.ts,
 * ideal-weight.ts, bsa.ts) call these
 * functions, and the public package `wimsta-formulas` is built from this file
 * by `scripts/export-formulas.mjs`. Rules:
 *   - only formulas that are in the registry live here;
 *   - no range / spread / category assembly (that stays in the site and /api/calc);
 *   - no imports, so the file can be copied verbatim into the package.
 *
 * Units are metric (kg, cm, years). A function returns `null` when a required
 * input is missing or the maths is undefined (log of a non-positive number etc.).
 */

export type Sex = 'female' | 'male';

const ok = (v: number | null | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

const IN_PER_CM = 0.393701; // cm → inch (Covert Bailey is an imperial equation)

// ---------------------------------------------------------------- bmi

/** who-bmi: weight / height². */
export const whoBmi = (weightKg: number, heightCm: number): number =>
  weightKg / (heightCm / 100) ** 2;

/** trefethen-bmi: 1.3 · weight / height^2.5. */
export const trefethenBmi = (weightKg: number, heightCm: number): number =>
  (1.3 * weightKg) / (heightCm / 100) ** 2.5;

// ---------------------------------------------------------------- waist-to-height

/** ashwell-whtr: waist / height (unrounded). */
export const ashwellWhtr = (waistCm: number, heightCm: number): number => waistCm / heightCm;

// ---------------------------------------------------------------- body-fat

export interface BodyFatInputs {
  sex: Sex;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  waist?: number | null; // natural (narrowest) waist
  abdomen?: number | null; // at the navel — US Navy men
  neck?: number | null;
  hip?: number | null;
  wrist?: number | null;
  forearm?: number | null;
  thigh?: number | null;
  calf?: number | null;
}

const bmiOf = (m: BodyFatInputs): number | null =>
  ok(m.height) && ok(m.weight) ? whoBmi(m.weight, m.height) : null;

/** deurenberg (1991): 1.20·BMI + 0.23·age − 10.8·sex − 5.4, male=1. */
export function deurenberg(m: BodyFatInputs): number | null {
  const bmi = bmiOf(m);
  if (bmi === null || !ok(m.age)) return null;
  return 1.2 * bmi + 0.23 * m.age - 10.8 * (m.sex === 'male' ? 1 : 0) - 5.4;
}

/** cun-bae (Gómez-Ambrosi 2012): polynomial in BMI, age, sex; female=1. */
export function cunBae(m: BodyFatInputs): number | null {
  const bmi = bmiOf(m);
  if (bmi === null || !ok(m.age)) return null;
  const age = m.age;
  const female = m.sex === 'male' ? 0 : 1;
  return (
    -44.988 +
    0.503 * age +
    10.689 * female +
    3.172 * bmi -
    0.026 * bmi ** 2 +
    0.181 * bmi * female -
    0.02 * bmi * age -
    0.005 * bmi ** 2 * female +
    0.00021 * bmi ** 2 * age
  );
}

/**
 * us-navy (Hodgdon & Beckett 1984). MEN: abdomen at the navel − neck (never the
 * narrow waist — see docs/specs/wimsta-bug-navy-male-abdomen.md). WOMEN: natural
 * waist + hip − neck.
 */
export function usNavy(m: BodyFatInputs): number | null {
  if (!ok(m.neck) || !ok(m.height)) return null;
  const h = m.height;
  if (m.sex === 'male') {
    if (!ok(m.abdomen)) return null;
    const arg = m.abdomen - m.neck;
    if (arg <= 0) return null;
    const denom = 1.0324 - 0.19077 * Math.log10(arg) + 0.15456 * Math.log10(h);
    if (denom === 0) return null;
    return 495 / denom - 450;
  }
  if (!ok(m.waist) || !ok(m.hip)) return null;
  const arg = m.waist + m.hip - m.neck;
  if (arg <= 0) return null;
  const denom = 1.29579 - 0.35004 * Math.log10(arg) + 0.221 * Math.log10(h);
  if (denom === 0) return null;
  return 495 / denom - 450;
}

/** rfm (Woolcott & Bergman 2018): 64 (men) / 76 (women) − 20 · height / waist. */
export function rfm(m: BodyFatInputs): number | null {
  if (!ok(m.height) || !ok(m.waist)) return null;
  return (m.sex === 'male' ? 64 : 76) - 20 * (m.height / m.waist);
}

/** covert-bailey (1999), inches internally; age-dependent coefficients. */
export function covertBailey(m: BodyFatInputs): number | null {
  if (!ok(m.age) || !ok(m.wrist)) return null;
  const age = m.age;
  const wristIn = m.wrist * IN_PER_CM;
  const waistIn = ok(m.waist) ? m.waist * IN_PER_CM : null;
  const hipIn = ok(m.hip) ? m.hip * IN_PER_CM : null;
  if (m.sex === 'male') {
    const forearmIn = ok(m.forearm) ? m.forearm * IN_PER_CM : null;
    if (waistIn === null || hipIn === null || forearmIn === null) return null;
    const forearmCoef = age <= 30 ? 3 : 2.7;
    return waistIn + 0.5 * hipIn - forearmCoef * forearmIn - wristIn;
  }
  const thighIn = ok(m.thigh) ? m.thigh * IN_PER_CM : null;
  const calfIn = ok(m.calf) ? m.calf * IN_PER_CM : null;
  if (hipIn === null || thighIn === null || calfIn === null) return null;
  const thighCoef = age <= 30 ? 0.8 : 1.0;
  return hipIn + thighCoef * thighIn - 2 * calfIn - wristIn;
}

// ---------------------------------------------------------------- body-fat-ranges

export interface FatRange {
  healthyLow: number;
  healthyHigh: number;
  overfatHigh: number;
}

// Gallagher 2000, Table 4 (BMI-anchored healthy % body fat), by age band and sex.
const GALLAGHER_FEMALE: FatRange[] = [
  { healthyLow: 21, healthyHigh: 33, overfatHigh: 39 },
  { healthyLow: 23, healthyHigh: 34, overfatHigh: 40 },
  { healthyLow: 24, healthyHigh: 36, overfatHigh: 42 },
];
const GALLAGHER_MALE: FatRange[] = [
  { healthyLow: 8, healthyHigh: 20, overfatHigh: 25 },
  { healthyLow: 11, healthyHigh: 22, overfatHigh: 28 },
  { healthyLow: 13, healthyHigh: 25, overfatHigh: 30 },
];

/** gallagher-ranges: healthy % body fat by age band (20–39 / 40–59 / 60–79) and sex. */
export function gallagherRanges(age: number | null, sex: Sex): FatRange {
  const band =
    typeof age === 'number' && Number.isFinite(age) ? (age < 40 ? 0 : age < 60 ? 1 : 2) : 0;
  return (sex === 'male' ? GALLAGHER_MALE : GALLAGHER_FEMALE)[band];
}

// ---------------------------------------------------------------- max-heart-rate

/** tanaka (2001): 208 − 0.7 · age. */
export const tanaka = (age: number): number => 208 - 0.7 * age;

/** gulati (2010): 206 − 0.88 · age; women only (null for men). */
export const gulati = (age: number, sex: Sex): number | null =>
  sex === 'male' ? null : 206 - 0.88 * age;

/** fox: 220 − age. */
export const fox = (age: number): number => 220 - age;

/** nes (HUNT, 2013): 211 − 0.64 · age. */
export const nes = (age: number): number => 211 - 0.64 * age;

/** londeree (Londeree & Moeschberger 1982): 206.3 − 0.711 · age. */
export const londeree = (age: number): number => 206.3 - 0.711 * age;

/** inbar (1994): 205.8 − 0.685 · age. */
export const inbar = (age: number): number => 205.8 - 0.685 * age;

// ---------------------------------------------------------------- bmr

export interface BmrInputs {
  sex: Sex;
  weight: number | null;
  height: number | null;
  age: number | null;
  bodyFat?: number | null; // % — Katch–McArdle only
}

/** mifflin-st-jeor (1990), in its usual rounded form: 10·w + 6.25·h − 5·age + 5 (men) / −161 (women). */
export function mifflinStJeor(m: BmrInputs): number | null {
  if (!ok(m.weight) || !ok(m.height) || !ok(m.age)) return null;
  const { weight: w, height: h, age: a } = m;
  return 10 * w + 6.25 * h - 5 * a + (m.sex === 'male' ? 5 : -161);
}

/** harris-benedict-1919 (original). */
export function harrisBenedict1919(m: BmrInputs): number | null {
  if (!ok(m.weight) || !ok(m.height) || !ok(m.age)) return null;
  const { weight: w, height: h, age: a } = m;
  return m.sex === 'male'
    ? 66.473 + 13.7516 * w + 5.0033 * h - 6.755 * a
    : 655.0955 + 9.5634 * w + 1.8496 * h - 4.6756 * a;
}

/** harris-benedict-1984 (Roza & Shizgal revision). */
export function harrisBenedict1984(m: BmrInputs): number | null {
  if (!ok(m.weight) || !ok(m.height) || !ok(m.age)) return null;
  const { weight: w, height: h, age: a } = m;
  return m.sex === 'male'
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
    : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a;
}

/** katch-mcardle: 370 + 21.6 · lean mass, lean = weight · (1 − bodyFat/100). */
export function katchMcArdle(m: Pick<BmrInputs, 'weight' | 'bodyFat'>): number | null {
  if (!ok(m.weight) || !ok(m.bodyFat) || m.bodyFat >= 100) return null;
  const lean = m.weight * (1 - m.bodyFat / 100);
  return 370 + 21.6 * lean;
}

// ---------------------------------------------------------------- ideal-weight

/** Inches above 5 ft (60 in) — the imperial base of the drug-dosing formulas. */
const inchesOver60 = (heightCm: number): number => (heightCm - 152.4) / 2.54;

const positive = (v: number): number | null => (Number.isFinite(v) && v > 0 ? v : null);

/** devine (1974): 50.0 (men) / 45.5 (women) + 2.3 kg per inch over 5 ft. */
export function devine(heightCm: number, sex: Sex): number | null {
  if (!ok(heightCm)) return null;
  const io = inchesOver60(heightCm);
  return positive(sex === 'male' ? 50.0 + 2.3 * io : 45.5 + 2.3 * io);
}

/** robinson (1983): 51.65 + 1.85 (men) / 48.67 + 1.65 (women) kg per inch over 5 ft. */
export function robinson(heightCm: number, sex: Sex): number | null {
  if (!ok(heightCm)) return null;
  const io = inchesOver60(heightCm);
  return positive(sex === 'male' ? 51.65 + 1.85 * io : 48.67 + 1.65 * io);
}

/** miller-ideal-weight (1983): 56.2 + 1.41 (men) / 53.1 + 1.36 (women) kg per inch over 5 ft. */
export function millerIdealWeight(heightCm: number, sex: Sex): number | null {
  if (!ok(heightCm)) return null;
  const io = inchesOver60(heightCm);
  return positive(sex === 'male' ? 56.2 + 1.41 * io : 53.1 + 1.36 * io);
}

/** peterson (2016): 2.2·BMI + 3.5·BMI·(height_m − 1.5) at BMI 22; same for both sexes. */
export function peterson(heightCm: number): number | null {
  if (!ok(heightCm)) return null;
  const hM = heightCm / 100;
  return positive(2.2 * 22 + 3.5 * 22 * (hM - 1.5));
}

// ---------------------------------------------------------------- bsa (body surface area, m²)

/** mosteller (1987): √(height · weight / 3600). */
export const mosteller = (heightCm: number, weightKg: number): number =>
  Math.sqrt((heightCm * weightKg) / 3600);

/** du-bois (1916): 0.007184 · height^0.725 · weight^0.425. */
export const duBois = (heightCm: number, weightKg: number): number =>
  0.007184 * heightCm ** 0.725 * weightKg ** 0.425;

/** haycock (1978): 0.024265 · height^0.3964 · weight^0.5378. */
export const haycock = (heightCm: number, weightKg: number): number =>
  0.024265 * heightCm ** 0.3964 * weightKg ** 0.5378;
