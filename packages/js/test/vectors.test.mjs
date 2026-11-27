// Every vector must reproduce within 1e-6, in both ESM and CJS builds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from '../dist/esm/index.js';
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');

for (const [name, mod] of [['esm', esm], ['cjs', cjs]]) {
  test(`${name}: all vectors match`, () => {
    const V = mod.vectors.vectors;
    assert.ok(V.length > 0, 'no vectors');
    let n = 0;
    for (const v of V) {
      const r = mod.calculate(v.formula_id, v.inputs);
      if (typeof v.value === 'number') assert.ok(Math.abs(r.value - v.value) <= 1e-6, `${v.formula_id} ${JSON.stringify(v.inputs)}: ${r.value} vs ${v.value}`);
      else assert.deepEqual(r.value, v.value);
      assert.equal(r.unit, v.unit);
      n++;
    }
    console.log(`${name}: ${n}/${V.length} vectors`);
  });
  test(`${name}: errors`, () => {
    assert.throws(() => mod.calculate('astrand', {}), /unknown formula/);
    assert.throws(() => mod.calculate('fox', { age: 17 }), /age must be/);
    assert.throws(() => mod.calculate('gulati', { sex: 'male', age: 40 }), /women only/);
    assert.throws(() => mod.calculate('us-navy', { sex: 'male', height_cm: 180, neck_cm: 39, waist_cm: 88 }), /abdomen_cm/);
    assert.equal(mod.REGISTRY_VERSION, mod.registry.registry_version);
    assert.equal(mod.listFormulas({ category: 'bmr' }).length, 4);
  });
}
