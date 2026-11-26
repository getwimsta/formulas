// Rebuilds data/vectors.json and packages/js/src/vectors.ts.
//   value      — the site's own equation module (packages/js, built), unrounded
//   api_value  — the live /api/calc answer for the same inputs (rounded as the site shows it)
// The script fails unless round(value) === api_value for every formula the API returns.
//   node scripts/make-vectors.mjs [--api https://wimsta.com]
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--api');
const API = i > 0 ? process.argv[i + 1] : 'https://wimsta.com';
const pkg = await import('file://' + join(root, 'packages/js/dist/esm/index.js'));
const registry = JSON.parse(readFileSync(join(root, 'data/registry.json'), 'utf8'));

// 10 profiles, 5 per sex; includes the API bounds (age 18 and 100, height 100/250, weight 20/350 …).
const P = [
  { sex: 'female', age: 18, height_cm: 150, weight_kg: 45, waist_cm: 60, neck_cm: 29, hip_cm: 84, wrist_cm: 14, forearm_cm: 21, thigh_cm: 48, calf_cm: 31, body_fat_pct: 22 },
  { sex: 'female', age: 30, height_cm: 165, weight_kg: 62, waist_cm: 72, neck_cm: 32, hip_cm: 98, wrist_cm: 15, forearm_cm: 23, thigh_cm: 55, calf_cm: 35, body_fat_pct: 28 },
  { sex: 'female', age: 47, height_cm: 172, weight_kg: 88, waist_cm: 94, neck_cm: 35, hip_cm: 112, wrist_cm: 16, forearm_cm: 26, thigh_cm: 63, calf_cm: 39, body_fat_pct: 38 },
  { sex: 'female', age: 68, height_cm: 158, weight_kg: 70, waist_cm: 90, neck_cm: 34, hip_cm: 104, wrist_cm: 15.5, forearm_cm: 25, thigh_cm: 54, calf_cm: 34, body_fat_pct: 40 },
  { sex: 'female', age: 100, height_cm: 100, weight_kg: 20, waist_cm: 45, neck_cm: 20, hip_cm: 60, wrist_cm: 10, forearm_cm: 15, thigh_cm: 30, calf_cm: 20, body_fat_pct: 3 },
  { sex: 'male', age: 18, height_cm: 250, weight_kg: 350, waist_cm: 160, abdomen_cm: 170, neck_cm: 60, hip_cm: 180, wrist_cm: 25, forearm_cm: 45, body_fat_pct: 65 },
  { sex: 'male', age: 25, height_cm: 178, weight_kg: 74, waist_cm: 80, abdomen_cm: 84, neck_cm: 38, hip_cm: 95, wrist_cm: 17, forearm_cm: 28, body_fat_pct: 14 },
  { sex: 'male', age: 35, height_cm: 180, weight_kg: 85, waist_cm: 88, abdomen_cm: 92, neck_cm: 39, hip_cm: 100, wrist_cm: 17.5, forearm_cm: 29, body_fat_pct: 20 },
  { sex: 'male', age: 52, height_cm: 170, weight_kg: 96, waist_cm: 102, abdomen_cm: 108, neck_cm: 42, hip_cm: 106, wrist_cm: 18, forearm_cm: 30, body_fat_pct: 30 },
  { sex: 'male', age: 77, height_cm: 192, weight_kg: 81, waist_cm: 93, abdomen_cm: 97, neck_cm: 40, hip_cm: 101, wrist_cm: 18.5, forearm_cm: 28, body_fat_pct: 24 },
];

const NEED = {
  'body-fat': ['sex', 'age', 'height_cm', 'weight_kg', 'waist_cm', 'abdomen_cm', 'neck_cm', 'hip_cm', 'wrist_cm', 'forearm_cm', 'thigh_cm', 'calf_cm'],
  'bmr': ['sex', 'age', 'height_cm', 'weight_kg', 'body_fat_pct'],
  'bmi': ['weight_kg', 'height_cm'],
  'max-heart-rate': ['sex', 'age'],
  'waist-to-height': ['waist_cm', 'height_cm'],
};
const ROUND = { 'body-fat': 1, 'bmi': 1, 'bmr': 0, 'max-heart-rate': 0, 'waist-to-height': 2 };
const rnd = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const pick = (p, ks) => Object.fromEntries(ks.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]));

async function api(endpoint, p) {
  const q = new URLSearchParams(pick(p, NEED[endpoint])).toString();
  let r;
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((s) => setTimeout(s, 600)); // stay under the API rate limit (20 / 10 s per IP)
    r = await fetch(`${API}/api/calc/${endpoint}?${q}`);
    if (r.status !== 429) break;
    await new Promise((s) => setTimeout(s, 10_000));
  }
  if (!r.ok) throw new Error(`${endpoint} ${q}: HTTP ${r.status}`);
  const j = await r.json();
  const res = j.result;
  if (endpoint === 'waist-to-height') return { 'ashwell-whtr': res.ratio };
  return Object.fromEntries(res.formulas.filter((f) => f.registry_id).map((f) => [f.registry_id, f.value]));
}

const out = [];
let checked = 0;
for (const p of P) {
  const live = {};
  for (const ep of Object.keys(NEED)) Object.assign(live, await api(ep, p));
  for (const f of registry.formulas) {
    let r;
    try { r = pkg.calculate(f.id, p); } catch { continue; } // not applicable (e.g. Gulati for men)
    const cat = f.category;
    const apiValue = live[f.id] ?? null;
    if (typeof r.value === 'number' && apiValue !== null) {
      if (rnd(r.value, ROUND[cat]) !== apiValue) throw new Error(`${f.id} ${JSON.stringify(p)}: module ${r.value} → ${rnd(r.value, ROUND[cat])}, API ${apiValue}`);
      checked++;
    }
    const needKeys = Object.keys(p).filter((k) => { try { const q = { ...p }; delete q[k]; pkg.calculate(f.id, q); return false; } catch { return true; } });
    out.push({ formula_id: f.id, inputs: pick(p, needKeys), value: r.value, unit: r.unit, api_value: apiValue, api_round_digits: apiValue === null ? null : ROUND[cat], registry_version: registry.registry_version });
  }
}
const doc = { registry_version: registry.registry_version, generated: new Date().toISOString().slice(0, 10), api: API, tolerance: 1e-6, note: 'value = unrounded result of the registry equation; api_value = live /api/calc answer, rounded as the site displays it (null where the API does not return this formula on its own, e.g. katch-mcardle without body_fat_pct in the range endpoint or gallagher-ranges).', vectors: out };
writeFileSync(join(root, 'data/vectors.json'), JSON.stringify(doc, null, 2) + '\n');
writeFileSync(join(root, 'packages/js/src/vectors.ts'), '// GENERATED by scripts/make-vectors.mjs — do not edit.\nexport default ' + JSON.stringify(doc, null, 2) + ';\n');
console.log(`vectors: ${out.length}; checked against live API: ${checked}; mismatches: 0`);
writeFileSync(join(root, 'packages/python/src/wimsta_formulas/data/vectors.json'), JSON.stringify(doc, null, 2) + '\n');
