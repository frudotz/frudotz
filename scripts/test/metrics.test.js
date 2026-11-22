'use strict';
// Run: node --test scripts/test/metrics.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { computeMetrics, computeStreaks } = require('../lib/metrics');
const { renderStats, renderHeatmap } = require('../lib/render');
const { writeIfChanged, signatureOf, REFERENCE_DATE } = require('../lib/output');

const map = entries => new Map(entries);

test('current streak counts today when today has contributions', () => {
  const counts = map([['2026-11-18', 0], ['2026-11-19', 2], ['2026-11-20', 1], ['2026-11-21', 3], ['2026-11-22', 4]]);
  const r = computeStreaks(counts, '2026-11-22');
  assert.equal(r.current.length, 4);
  assert.equal(r.current.start, '2026-11-19');
  assert.equal(r.current.end, '2026-11-22');
  assert.equal(r.todayZero, false);
});

test('today without contributions does not break a streak that ran through yesterday', () => {
  const counts = map([['2026-11-20', 1], ['2026-11-21', 3], ['2026-11-22', 0]]);
  const r = computeStreaks(counts, '2026-11-22');
  assert.equal(r.current.length, 2);
  assert.equal(r.current.start, '2026-11-20');
  assert.equal(r.current.end, '2026-11-21');
  assert.equal(r.todayZero, true);
});

test('no contributions yesterday or today means no current streak', () => {
  const counts = map([['2026-11-19', 5], ['2026-11-20', 0], ['2026-11-21', 0], ['2026-11-22', 0]]);
  const r = computeStreaks(counts, '2026-11-22');
  assert.equal(r.current.length, 0);
  assert.equal(r.current.start, null);
  assert.equal(r.longest.length, 1);
});

test('longest streak spans year boundaries and keeps the first of equal runs', () => {
  const counts = map([
    ['2025-12-30', 1], ['2025-12-31', 1], ['2026-01-01', 1], // run of 3
    ['2026-01-02', 0],
    ['2026-03-10', 2], ['2026-03-11', 2], ['2026-03-12', 2], // run of 3, later
    ['2026-03-13', 0],
    ['2026-11-22', 1],
  ]);
  const r = computeStreaks(counts, '2026-11-22');
  assert.equal(r.longest.length, 3);
  assert.equal(r.longest.start, '2025-12-30');
  assert.equal(r.longest.end, '2026-01-01');
});

test('days after today are ignored', () => {
  const counts = map([['2026-11-21', 1], ['2026-11-22', 1], ['2026-11-23', 9], ['2026-11-24', 9]]);
  const r = computeStreaks(counts, '2026-11-22');
  assert.equal(r.longest.length, 2);
  assert.equal(r.current.end, '2026-11-22');
});

function rawFixture() {
  return {
    login: 'example',
    createdAt: '2016-03-01T00:00:00Z',
    fetchedAt: '2026-11-22T00:00:00.000Z',
    pullRequests: 7,
    issues: 3,
    commitsThisYear: 120,
    reposLastYear: 9,
    contributionYears: [2025, 2026],
    yearCalendars: [
      { year: 2025, totalContributions: 40, days: [{ date: '2025-11-20', count: 40 }] },
      { year: 2026, totalContributions: 60, days: [{ date: '2026-11-21', count: 5 }, { date: '2026-11-22', count: 0 }] },
    ],
    heatmap: {
      totalContributions: 5,
      days: [
        { date: '2026-11-21', count: 5, level: 'FOURTH_QUARTILE' },
        { date: '2026-11-22', count: 0, level: 'NONE' },
        { date: '2026-11-23', count: 0, level: 'NONE' },
      ],
    },
    repos: [
      { name: 'a', isArchived: false, stargazerCount: 10, languages: [{ name: 'JavaScript', color: '#f1e05a', size: 600 }, { name: 'CSS', color: '#563d7c', size: 400 }] },
      { name: 'b', isArchived: true, stargazerCount: 5, languages: [{ name: 'Python', color: '#3572A5', size: 5000 }] },
      { name: 'c', isArchived: false, stargazerCount: 0, languages: [{ name: 'JavaScript', color: null, size: 400 }] },
    ],
  };
}

test('stars include archived repos, languages exclude them', () => {
  const m = computeMetrics(rawFixture(), '2026-11-22');
  assert.equal(m.stats.stars, 15);
  assert.equal(m.languages.total, 1400);
  assert.deepEqual(m.languages.items.map(l => l.name), ['JavaScript', 'CSS']);
  assert.equal(m.languages.items[0].size, 1000);
  assert.equal(m.languages.items[0].color, '#f1e05a');
  assert.ok(Math.abs(m.languages.items[0].pct - (1000 / 1400) * 100) < 1e-9);
});

test('streak total sums all yearly calendars and heatmap drops future days', () => {
  const m = computeMetrics(rawFixture(), '2026-11-22');
  assert.equal(m.streak.total, 100);
  assert.equal(m.streak.firstYear, 2025);
  assert.equal(m.streak.lastYear, 2026);
  assert.equal(m.streak.current.length, 1);
  assert.equal(m.heatmap.days.length, 2);
  assert.equal(m.heatmap.days[0].level, 4);
  assert.equal(m.heatmap.total, 5);
  assert.equal(m.heatmap.active, 1);
});

test('top languages are limited to six and sorted by bytes', () => {
  const raw = rawFixture();
  raw.repos = [{
    name: 'x', isArchived: false, stargazerCount: 0,
    languages: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((n, i) => ({ name: n, color: null, size: 100 + i })),
  }];
  const m = computeMetrics(raw, '2026-11-22');
  assert.equal(m.languages.items.length, 6);
  assert.equal(m.languages.items[0].name, 'H');
});

test('signature is computed on the fixed reference date, so it ignores the displayed date', () => {
  const m = computeMetrics(rawFixture(), '2026-11-22');
  const a = renderStats(m, 'tr', 'light', '2026-11-22');
  const b = renderStats(m, 'tr', 'light', '2026-11-23');
  assert.notEqual(a, b, 'the displayed date does change the markup');
  assert.equal(a.replace('22 Kasım 2026', 'X'), b.replace('23 Kasım 2026', 'X'), 'and only the date text');

  const sig = mm => signatureOf(renderStats(mm, 'tr', 'light', REFERENCE_DATE));
  const m2 = computeMetrics({ ...rawFixture(), commitsThisYear: 121 }, '2026-11-22');
  assert.equal(sig(m), sig(computeMetrics(rawFixture(), '2026-11-22')));
  assert.notEqual(sig(m), sig(m2), 'a data change changes the signature');
});

test('writeIfChanged writes once, then skips unchanged data and rewrites on change', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-stats-'));
  try {
    const m = computeMetrics(rawFixture(), '2026-11-22');
    const render = d => renderHeatmap(m.heatmap, 'en', 'dark', d);
    assert.equal(writeIfChanged(dir, 'contrib-dark.svg', render, '2026-11-22'), true);
    const first = fs.readFileSync(path.join(dir, 'contrib-dark.svg'), 'utf8');
    assert.match(first, /<!-- sig: [0-9a-f]{16} -->/);
    assert.match(first, /2 Kasım 2026|2 November 2026|22 November 2026/);

    assert.equal(writeIfChanged(dir, 'contrib-dark.svg', render, '2026-11-23'), false);
    assert.equal(fs.readFileSync(path.join(dir, 'contrib-dark.svg'), 'utf8'), first);

    const m2 = computeMetrics({ ...rawFixture(), heatmap: { totalContributions: 9, days: [{ date: '2026-11-22', count: 9, level: 'FOURTH_QUARTILE' }] } }, '2026-11-22');
    assert.equal(writeIfChanged(dir, 'contrib-dark.svg', d => renderHeatmap(m2.heatmap, 'en', 'dark', d), '2026-11-23'), true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('rendered SVG is self-contained: no external references or scripts', () => {
  const m = computeMetrics(rawFixture(), '2026-11-22');
  for (const svg of [
    renderStats(m, 'en', 'light', '2026-11-22'),
    renderStats(m, 'tr', 'dark', '2026-11-22'),
    renderHeatmap(m.heatmap, 'tr', 'light', '2026-11-22'),
  ]) {
    assert.doesNotMatch(svg, /<script|@import|href=|xlink:href|url\(http|src=/i);
  }
});
