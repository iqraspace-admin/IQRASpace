// Converts the filled-in reports/urdu_translation_template.csv (or any CSV with `slug` and
// `translation_ur` columns) into data/urdu_translations.json for build_canonical.mjs.
//
//   node import_urdu.mjs path/to/filled.csv --source "Hisnul Muslim, Urdu (Arshad Bashir Madani), 2nd ed."
//
// Rows with an empty translation_ur are skipped. Text is kept verbatim.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { here } from './lib.mjs';

const file = process.argv[2];
const si = process.argv.indexOf('--source');
const source = si > 0 ? process.argv[si + 1] : '';
if (!file || !source) {
  console.error('usage: node import_urdu.mjs <csv> --source "<exact source of the Urdu text>"');
  process.exit(2);
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const [header, ...rows] = parseCsv(readFileSync(file, 'utf8').replace(/^﻿/, ''));
const iSlug = header.indexOf('slug');
const iUr = header.indexOf('translation_ur');
if (iSlug < 0 || iUr < 0) throw new Error('CSV needs slug and translation_ur columns');
const out = rows
  .filter((r) => (r[iUr] ?? '').trim())
  .map((r) => ({ slug: r[iSlug].trim(), translation_ur: r[iUr].trim(), source }));
writeFileSync(join(here, 'data', 'urdu_translations.json'), JSON.stringify(out, null, 1));
console.log(`wrote data/urdu_translations.json with ${out.length} entries — now run: node build_canonical.mjs --write-bundled`);
