#!/usr/bin/env node
'use strict';
// Regenerates the profile stats cards and contribution heatmaps in assets/a-studio.
//
//   GITHUB_TOKEN=... node scripts/profile-stats.js                  # live GraphQL data
//   node scripts/profile-stats.js --fixture scripts/fixtures/sample.json --out <dir> [--today YYYY-MM-DD]
//   GITHUB_TOKEN=... node scripts/profile-stats.js --dump-raw <file> # save the raw public snapshot
//
// Environment: GITHUB_TOKEN (required for live mode), PROFILE_LOGIN (default: frudotz).
// Requires Node 20+. Uses Node built-in modules only.

const fs = require('fs');
const path = require('path');
const { fetchRaw } = require('./lib/github');
const { computeMetrics } = require('./lib/metrics');
const { renderStats, renderHeatmap } = require('./lib/render');
const { writeIfChanged } = require('./lib/output');
const { assertSnapshot } = require('./lib/validate');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fixture') args.fixture = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--today') args.today = argv[++i];
    else if (a === '--dump-raw') args.dumpRaw = argv[++i];
    else throw new Error(`Bilinmeyen argüman: ${a}`);
  }
  if (args.today && !/^\d{4}-\d{2}-\d{2}$/.test(args.today)) throw new Error('--today YYYY-MM-DD biçiminde olmalı');
  return args;
}

const TARGETS = [];
for (const kind of ['stats', 'contrib']) {
  for (const theme of ['light', 'dark']) {
    for (const lang of ['en', 'tr']) {
      TARGETS.push({ kind, theme, lang, name: `${kind}-${theme}${lang === 'tr' ? '-tr' : ''}.svg` });
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let raw;
  if (args.fixture) {
    raw = JSON.parse(fs.readFileSync(args.fixture, 'utf8'));
  } else {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN tanımlı değil (çevrimdışı deneme için --fixture kullan).');
    raw = await fetchRaw(process.env.PROFILE_LOGIN || 'frudotz', token, new Date());
  }
  // Reject incomplete snapshots before anything is written (dump or SVG).
  assertSnapshot(raw);
  if (args.dumpRaw) fs.writeFileSync(args.dumpRaw, `${JSON.stringify(raw, null, 2)}\n`);

  const today = args.today || (raw.fetchedAt || new Date().toISOString()).slice(0, 10);
  const model = computeMetrics(raw, today);

  const outDir = args.out || path.join(__dirname, '..', 'assets', 'a-studio');
  fs.mkdirSync(outDir, { recursive: true });

  for (const t of TARGETS) {
    const render = t.kind === 'stats'
      ? date => renderStats(model, t.lang, t.theme, date)
      : date => renderHeatmap(model.heatmap, t.lang, t.theme, date);
    const changed = writeIfChanged(outDir, t.name, render, today);
    console.log(`${changed ? 'güncellendi' : 'değişmedi  '} ${t.name}`);
  }
}

main().catch(err => {
  console.error(`HATA: ${err.message}`);
  process.exit(1);
});
