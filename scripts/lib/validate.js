'use strict';
// Guards against partial API responses. A snapshot with any required field missing or mistyped is
// rejected before anything is rendered or written: missing data must never become 0 or an empty list.

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const isStr = v => typeof v === 'string' && v.length > 0;
const isArr = v => Array.isArray(v);
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isColor = v => v === null || isStr(v);

function check(ok, path) {
  if (!ok) throw new Error(`Eksik veya geçersiz alan: ${path}`);
}

const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

// Validates the normalized snapshot produced by lib/github.js (also the --fixture format).
function assertSnapshot(raw) {
  check(isObj(raw), 'snapshot');
  check(isStr(raw.login), 'login');
  check(isStr(raw.createdAt), 'createdAt');
  check(isStr(raw.fetchedAt), 'fetchedAt');
  check(isNum(raw.pullRequests), 'pullRequests.totalCount');
  check(isNum(raw.issues), 'issues.totalCount');
  check(isNum(raw.reposLastYear), 'repositoriesContributedTo.totalCount');
  check(isNum(raw.commitsThisYear), 'thisYear.totalCommitContributions');

  check(isArr(raw.contributionYears) && raw.contributionYears.length > 0 && raw.contributionYears.every(isNum), 'contributionYears');
  check(isArr(raw.yearCalendars) && raw.yearCalendars.length === raw.contributionYears.length,
    'yearCalendars (her katkı yılı için bir takvim)');
  raw.yearCalendars.forEach((y, i) => {
    check(isObj(y) && isNum(y.year) && isNum(y.totalContributions), `yearCalendars[${i}]`);
    check(isArr(y.days) && y.days.length > 0, `yearCalendars[${i}].days`);
    y.days.forEach((d, j) => check(isObj(d) && isStr(d.date) && isNum(d.count), `yearCalendars[${i}].days[${j}]`));
  });

  check(isObj(raw.heatmap) && isNum(raw.heatmap.totalContributions), 'heatmap.totalContributions');
  check(isArr(raw.heatmap.days) && raw.heatmap.days.length > 0, 'heatmap.days');
  raw.heatmap.days.forEach((d, j) => {
    check(isObj(d) && isStr(d.date) && isNum(d.count), `heatmap.days[${j}]`);
    check(LEVELS.includes(d.level) || (isNum(d.level) && d.level >= 0 && d.level <= 4), `heatmap.days[${j}].level`);
  });

  check(isArr(raw.repos), 'repositories.nodes');
  raw.repos.forEach((r, i) => {
    check(isObj(r) && isStr(r.name), `repos[${i}].name`);
    check(typeof r.isArchived === 'boolean', `repos[${i}].isArchived`);
    check(isNum(r.stargazerCount), `repos[${i}].stargazerCount`);
    check(isArr(r.languages), `repos[${i}].languages`);
    r.languages.forEach((l, j) => {
      check(isObj(l) && isStr(l.name) && isNum(l.size) && isColor(l.color), `repos[${i}].languages[${j}]`);
    });
  });
}

module.exports = { assertSnapshot, check, isObj, isArr, isNum, isStr, LEVELS };
