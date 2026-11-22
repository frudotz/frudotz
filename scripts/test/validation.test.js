'use strict';
// Run: node --test scripts/test/
// Offline: GitHub is replaced by a stub built from scripts/fixtures/sample.json.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { fetchRaw } = require('../lib/github');
const { assertSnapshot } = require('../lib/validate');
const { computeMetrics } = require('../lib/metrics');

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'sample.json');
const CLI = path.join(__dirname, '..', 'profile-stats.js');
const NOW = new Date('2026-11-22T12:00:00Z');
const clone = o => JSON.parse(JSON.stringify(o));
const loadFixture = () => JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

// Builds GraphQL response data for the stub from the fixture; `mutate` may break one part.
function apiData(fixture, query, variables, mutate = {}) {
  const calendarOf = days => ({
    totalContributions: days.reduce((s, d) => s + d.count, 0),
    weeks: [{ contributionDays: days.map(d => ({ date: d.date, contributionCount: d.count, contributionLevel: d.level || 'NONE' })) }],
  });
  if (query.includes('query Profile')) {
    const user = {
      login: fixture.login,
      createdAt: fixture.createdAt,
      pullRequests: { totalCount: fixture.pullRequests },
      issues: { totalCount: fixture.issues },
      repositoriesContributedTo: { totalCount: fixture.reposLastYear },
      thisYear: { totalCommitContributions: fixture.commitsThisYear, contributionYears: fixture.contributionYears },
      lastYear: { contributionCalendar: calendarOf(fixture.heatmap.days) },
    };
    if (mutate.profile) mutate.profile(user);
    return { user };
  }
  if (query.includes('query Repos')) {
    const nodes = fixture.repos.map(r => ({
      name: r.name,
      isArchived: r.isArchived,
      stargazerCount: r.stargazerCount,
      languages: {
        totalCount: r.languages.length,
        edges: r.languages.map(l => ({ size: l.size, node: { name: l.name, color: l.color } })),
      },
    }));
    if (mutate.repos) mutate.repos(nodes);
    return { user: { repositories: { pageInfo: { hasNextPage: false, endCursor: null }, nodes } } };
  }
  // YEAR_QUERY
  const year = Number(variables.from.slice(0, 4));
  const entry = fixture.yearCalendars.find(y => y.year === year);
  const cal = calendarOf(entry.days);
  if (mutate.year === year) mutate.yearFn(cal);
  return { user: { contributionsCollection: { contributionCalendar: cal } } };
}

function stubFetch(mutate) {
  const fixture = loadFixture();
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const data = apiData(fixture, body.query, body.variables, mutate);
    return { ok: true, status: 200, json: async () => ({ data }) };
  };
  return () => { globalThis.fetch = original; };
}

async function withStub(mutate, fn) {
  const restore = stubFetch(mutate);
  try { return await fn(); } finally { restore(); }
}

test('a complete fixture passes validation', () => {
  assert.doesNotThrow(() => assertSnapshot(loadFixture()));
});

test('each required top-level field is rejected when missing', () => {
  for (const field of ['login', 'createdAt', 'pullRequests', 'issues', 'reposLastYear', 'commitsThisYear',
    'contributionYears', 'yearCalendars', 'heatmap', 'repos']) {
    const raw = loadFixture();
    delete raw[field];
    assert.throws(() => assertSnapshot(raw), new RegExp(`Eksik veya geçersiz alan`), field);
  }
});

test('missing or null numbers are not treated as zero', () => {
  const raw = loadFixture();
  raw.issues = null;
  assert.throws(() => assertSnapshot(raw), /issues/);
  const raw2 = loadFixture();
  raw2.commitsThisYear = undefined;
  assert.throws(() => assertSnapshot(raw2), /thisYear\.totalCommitContributions/);
});

test('a missing year calendar or an empty year is rejected', () => {
  const short = loadFixture();
  short.yearCalendars.pop();
  assert.throws(() => assertSnapshot(short), /yearCalendars/);
  const empty = loadFixture();
  empty.yearCalendars[0].days = [];
  assert.throws(() => assertSnapshot(empty), /days/);
});

test('a repository without a language list is rejected', () => {
  const raw = loadFixture();
  delete raw.repos[0].languages;
  assert.throws(() => assertSnapshot(raw), /languages/);
});

test('unknown heatmap levels are rejected instead of drawn as empty', () => {
  const raw = loadFixture();
  raw.heatmap.days[0].level = 'BOGUS';
  assert.throws(() => assertSnapshot(raw), /level/);
});

test('fetchRaw on a complete stub returns a snapshot that computes metrics', async () => {
  const raw = await withStub({}, () => fetchRaw('sample-user', 'token', NOW));
  assert.equal(raw.commitsThisYear, loadFixture().commitsThisYear);
  assert.equal(raw.yearCalendars.length, 4);
  const m = computeMetrics(raw, '2026-11-22');
  assert.equal(m.stats.stars, 90);
});

test('fetchRaw rejects a profile response with a missing field', async () => {
  await withStub({ profile: u => { delete u.issues; } }, async () => {
    await assert.rejects(fetchRaw('sample-user', 'token', NOW), /issues/);
  });
});

test('fetchRaw rejects a repository page without nodes', async () => {
  const restore = (() => {
    const original = globalThis.fetch;
    const fixture = loadFixture();
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(init.body);
      const data = apiData(fixture, body.query, body.variables, {});
      if (body.query.includes('query Repos')) delete data.user.repositories.nodes;
      return { ok: true, status: 200, json: async () => ({ data }) };
    };
    return () => { globalThis.fetch = original; };
  })();
  try {
    await assert.rejects(fetchRaw('sample-user', 'token', NOW), /repositories\.nodes/);
  } finally {
    restore();
  }
});

test('fetchRaw rejects a year calendar without weeks', async () => {
  await withStub({ year: 2024, yearFn: cal => { delete cal.weeks; } }, async () => {
    await assert.rejects(fetchRaw('sample-user', 'token', NOW), /weeks/);
  });
});

test('a repository with more than 100 languages logs a warning', async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = msg => warnings.push(String(msg));
  try {
    await withStub({ repos: nodes => { nodes[0].languages.totalCount = 150; } }, () => fetchRaw('sample-user', 'token', NOW));
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /150 dil/);
});

test('CLI exits 1 and writes no SVG when the fixture is incomplete', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-stats-cli-'));
  try {
    const broken = clone(loadFixture());
    delete broken.pullRequests;
    const fixturePath = path.join(dir, 'broken.json');
    const out = path.join(dir, 'out');
    fs.writeFileSync(fixturePath, JSON.stringify(broken));
    const res = spawnSync(process.execPath, [CLI, '--fixture', fixturePath, '--out', out, '--today', '2026-11-22'], { encoding: 'utf8' });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /pullRequests/);
    assert.equal(fs.existsSync(out) ? fs.readdirSync(out).filter(f => f.endsWith('.svg')).length : 0, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
