// Acceptance 7.2: the packages contain no range assembly and no formula outside the registry.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (/node_modules|dist|__pycache__|data$/.test(f) ? [] : walk(p)) : [p]; });
const files = [...walk(join(root, 'packages/js/src')), ...walk(join(root, 'packages/python/src'))].filter((f) => /\.(ts|py)$/.test(f) && !/data\.ts$|vectors\.ts$/.test(f));
const banned = [/\bspread\b/i, /\bmidpoint\b/i, /computeBodyFat|computeBmr|computeMaxHr|categoryFor/, // formulas the site runs that are NOT (yet) in the registry:
  /whoFao|who_fao/i, /\b(astrand|gellish|broca|lorentz|hamwi|gehan|boyd|fujimoto|takahira|schlich)/i, /\bmiller(?![-_]ideal|IdealWeight)/i,/\b(low|high)\s*[:=]/];
let hits = 0;
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*\*|#)/.test(line)) return; // comments describe the rule, not code
    for (const re of banned) if (re.test(line)) { console.log(`${f.slice(root.length + 1)}:${i + 1}: ${line.trim()}`); hits++; }
  });
}
console.log(`scanned ${files.length} files, ${hits} hits`);
process.exit(hits ? 1 : 0);
