'use strict';
// Pure computations on the raw snapshot (see lib/github.js). No I/O, no network.

const { assertSnapshot } = require('./validate');

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const TOP_LANGUAGES = 6;

const sum = xs => xs.reduce((a, b) => a + b, 0);

// Unknown levels are an error; they must not be drawn as "no contributions".
function levelOf(v) {
  if (typeof v === 'number' && v >= 0 && v <= 4) return v;
  if (Object.prototype.hasOwnProperty.call(LEVELS, v)) return LEVELS[v];
  throw new Error(`Bilinmeyen katkı düzeyi: ${v}`);
}

// Date helpers work on 'YYYY-MM-DD' strings in UTC (GitHub calendar days are UTC dates).
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Current streak: if today has no contribution yet, the streak is counted from yesterday.
// Longest streak: the longest run of consecutive days with at least one contribution.
function computeStreaks(countByDate, today) {
  const start = countByDate.get(today) > 0 ? today : addDays(today, -1);
  let current = { length: 0, start: null, end: null };
  let length = 0;
  let first = null;
  for (let d = start; countByDate.get(d) > 0; d = addDays(d, -1)) {
    length++;
    first = d;
  }
  if (length > 0) current = { length, start: first, end: start };

  const dates = [...countByDate.keys()].filter(d => d <= today).sort();
  let longest = { length: 0, start: null, end: null };
  let run = null;
  for (const date of dates) {
    if (countByDate.get(date) > 0) {
      if (run && addDays(run.end, 1) === date) {
        run.length++;
        run.end = date;
      } else {
        run = { length: 1, start: date, end: date };
      }
      if (run.length > longest.length) longest = { ...run };
    } else {
      run = null;
    }
  }
  return { current, longest, todayZero: !(countByDate.get(today) > 0) };
}

function computeMetrics(raw, today) {
  assertSnapshot(raw);
  const repos = raw.repos;

  const stars = sum(repos.map(r => r.stargazerCount));

  // Languages: owned, non-fork, non-archived repositories (forks are already excluded by the query).
  const byName = new Map();
  for (const repo of repos) {
    if (repo.isArchived) continue;
    for (const lang of repo.languages) {
      if (!(lang.size > 0)) continue;
      const cur = byName.get(lang.name) || { name: lang.name, color: null, size: 0 };
      cur.size += lang.size;
      cur.color = cur.color || lang.color || null;
      byName.set(lang.name, cur);
    }
  }
  const allLanguages = [...byName.values()];
  const languageTotal = sum(allLanguages.map(l => l.size));
  const topLanguages = allLanguages
    .sort((a, b) => b.size - a.size || a.name.localeCompare(b.name))
    .slice(0, TOP_LANGUAGES)
    .map(l => ({ ...l, pct: languageTotal ? (l.size / languageTotal) * 100 : 0 }));

  // Streak: every contributionYears entry, one contributionsCollection call each.
  const countByDate = new Map();
  for (const y of raw.yearCalendars) {
    for (const d of y.days) countByDate.set(d.date, d.count);
  }
  const { current, longest, todayZero } = computeStreaks(countByDate, today);
  const totalContributions = sum(raw.yearCalendars.map(y => y.totalContributions));
  const years = raw.contributionYears;

  // Heatmap: last 12 months, days after today are excluded.
  const heatDays = raw.heatmap.days
    .filter(d => d.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ date: d.date, count: d.count, level: levelOf(d.level) }));

  return {
    today,
    stats: {
      stars,
      commitsThisYear: raw.commitsThisYear,
      pullRequests: raw.pullRequests,
      issues: raw.issues,
      reposLastYear: raw.reposLastYear,
    },
    streak: {
      total: totalContributions,
      firstYear: years.length ? Math.min(...years) : null,
      lastYear: years.length ? Math.max(...years) : null,
      current,
      longest,
      todayZero,
    },
    languages: { total: languageTotal, items: topLanguages },
    heatmap: {
      total: sum(heatDays.map(d => d.count)),
      active: heatDays.filter(d => d.count > 0).length,
      days: heatDays,
    },
  };
}

module.exports = { computeMetrics, computeStreaks, addDays, levelOf };
