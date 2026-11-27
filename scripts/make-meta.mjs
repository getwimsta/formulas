// Generates .zenodo.json, CITATION.cff and the formula table in README.md from
// data/registry.json. Run after export.mjs. DOI comes from --doi (the Zenodo
// concept DOI) once the first release has been archived; until then it is omitted.
//   node scripts/make-meta.mjs [--doi 10.5281/zenodo.NNNNNNN]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--doi');
const DOI = i > 0 ? process.argv[i + 1] : readExistingDoi();
const reg = JSON.parse(readFileSync(join(root, 'data/registry.json'), 'utf8'));
const vec = JSON.parse(readFileSync(join(root, 'data/vectors.json'), 'utf8'));
const pkgVersion = JSON.parse(readFileSync(join(root, 'packages/js/package.json'), 'utf8')).version;

function readExistingDoi() {
  try {
    const m = readFileSync(join(root, 'CITATION.cff'), 'utf8').match(/^doi: "?([^"\n]+)"?/m);
    return m ? m[1] : null;
  } catch { return null; }
}

// Only real DOIs go to related_identifiers (some registry "doi" fields hold a plain URL).
const dois = [...new Set(reg.formulas.map((f) => f.source?.doi).filter((d) => d && /^https:\/\/doi\.org\/10\./.test(d)).map((d) => d.replace('https://doi.org/', '')))];
const cats = [...new Set(reg.formulas.map((f) => f.category))];

const description =
  `<p>Open registry of ${reg.formula_count} published equations for body composition and energy expenditure ` +
  `(categories: ${cats.join(', ')}), each with its primary source, coefficients, input list, sex coding, units, ` +
  `reported error, sample and limitations. Each entry records how it was verified: ` +
  `${reg.formulas.filter((f) => f.verification === 'primary').length} against the primary publication, the rest against secondary sources only.</p>` +
  `<p>Includes test vectors (${vec.vectors.length} input → output cases from the reference implementation, cross-checked ` +
  `against the live WIMSTA calculation API). Human-readable pages: <a href="https://wimsta.com/registry/">https://wimsta.com/registry/</a>.</p>` +
  `<p>Estimates for general information only; not medical advice.</p>`;

const zenodo = {
  upload_type: 'dataset',
  title: 'WIMSTA Formula Registry: body-composition and energy-expenditure equations with primary sources',
  creators: [{ name: 'WIMSTA' }],
  license: 'cc-by-4.0',
  description,
  keywords: ['body composition', 'body fat', 'basal metabolic rate', 'BMI', 'waist-to-height ratio', 'maximum heart rate', 'anthropometry', 'equations'],
  version: reg.registry_version,
  related_identifiers: [
    { relation: 'isDocumentedBy', identifier: 'https://wimsta.com/registry/', scheme: 'url' },
    { relation: 'isSupplementTo', identifier: 'https://wimsta.com/api/openapi.json', scheme: 'url' },
    ...dois.map((d) => ({ relation: 'references', identifier: d, scheme: 'doi' })),
  ],
};
writeFileSync(join(root, '.zenodo.json'), JSON.stringify(zenodo, null, 2) + '\n');

const cff = [
  'cff-version: 1.2.0',
  'message: "If you use this dataset, please cite it as below."',
  'type: dataset',
  'title: "WIMSTA Formula Registry: body-composition and energy-expenditure equations with primary sources"',
  'authors:',
  '  - name: "WIMSTA"',
  '    website: "https://wimsta.com"',
  '    email: "hello@wimsta.com"',
  `version: "${reg.registry_version}"`,
  `date-released: "${reg.last_updated}"`,
  ...(DOI ? [`doi: "${DOI}"`] : []),
  'url: "https://wimsta.com/registry/"',
  'repository-code: "https://github.com/getwimsta/formulas"',
  'license: CC-BY-4.0',
  'keywords:',
  ...zenodo.keywords.map((k) => `  - "${k}"`),
  '',
].join('\n');
writeFileSync(join(root, 'CITATION.cff'), cff);

// README formula table between markers
const rows = reg.formulas.map((f) => {
  const d = f.source?.doi;
  const src = d ? (d.startsWith('https://doi.org/') ? `[${d.replace('https://doi.org/', '')}](${d})` : `[link](${d})`) : '—';
  const page = f.canonical_page ? `[page](${f.canonical_page})` : `[registry](${reg.canonical_page})`;
  return `| \`${f.id}\` | ${f.name} | ${f.category} | ${f.source?.authors ?? ''} ${f.source?.year ?? ''} | ${src} | ${page} |`;
});
const table = ['| id | Name | Category | Source | DOI / source | WIMSTA page |', '|---|---|---|---|---|---|', ...rows].join('\n');
const cite = DOI
  ? `WIMSTA (${reg.last_updated.slice(0, 4)}). *WIMSTA Formula Registry* (version ${reg.registry_version}) [Data set]. https://doi.org/${DOI}`
  : `WIMSTA (${reg.last_updated.slice(0, 4)}). *WIMSTA Formula Registry* (version ${reg.registry_version}) [Data set]. https://wimsta.com/registry/`;
const bib = [
  '@dataset{wimsta_formula_registry,',
  '  author    = {{WIMSTA}},',
  '  title     = {WIMSTA Formula Registry: body-composition and energy-expenditure equations with primary sources},',
  `  year      = {${reg.last_updated.slice(0, 4)}},`,
  `  version   = {${reg.registry_version}},`,
  ...(DOI ? [`  doi       = {${DOI}},`] : []),
  '  url       = {https://wimsta.com/registry/},',
  '  publisher = {Zenodo}',
  '}',
].join('\n');

let readme = readFileSync(join(root, 'README.md'), 'utf8');
const put = (name, body) => {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(readme)) throw new Error('README marker missing: ' + name);
  readme = readme.replace(re, `$1\n${body}\n$2`);
};
put('table', table);
put('cite', `${cite}\n\n\`\`\`bibtex\n${bib}\n\`\`\``);
put('meta', `Registry version **${reg.registry_version}** · ${reg.formula_count} formulas · ${vec.vectors.length} test vectors · packages ${pkgVersion}`);
writeFileSync(join(root, 'README.md'), readme);
console.log(`zenodo: ${dois.length} DOI references; doi ${DOI ?? '(none yet)'}; README updated`);
