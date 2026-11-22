'use strict';
// Fetches the public profile data needed for the stats card and the heatmap via the GitHub GraphQL API.
// Uses only Node built-ins (global fetch, Node 20+). The token is read by the caller and never logged or stored.
// Every field read here is checked: a missing or mistyped field throws instead of becoming 0 or an empty list.

const { check, isObj, isArr, isNum, isStr, assertSnapshot } = require('./validate');

const API = 'https://api.github.com/graphql';
const LANGUAGE_PAGE = 100;

const PROFILE_QUERY = `
query Profile($login: String!, $thisYearFrom: DateTime!, $lastYearFrom: DateTime!, $now: DateTime!) {
  user(login: $login) {
    login
    createdAt
    pullRequests(first: 1) { totalCount }
    issues(first: 1) { totalCount }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) { totalCount }
    thisYear: contributionsCollection(from: $thisYearFrom, to: $now) {
      totalCommitContributions
      contributionYears
    }
    lastYear: contributionsCollection(from: $lastYearFrom, to: $now) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const REPOS_QUERY = `
query Repos($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, ownerAffiliations: [OWNER], isFork: false) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        isArchived
        stargazerCount
        languages(first: 100) { totalCount edges { size node { name color } } }
      }
    }
  }
}`;

const YEAR_QUERY = `
query Year($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function gql(query, variables, token) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(API, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'User-Agent': 'profile-stats-script',
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (err) {
      if (attempt < 4) { await sleep(1000 * attempt); continue; }
      throw new Error(`GitHub API ağ hatası: ${err.code || err.message}`);
    }
    if (res.status >= 500 && attempt < 4) { await sleep(1000 * attempt); continue; }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) throw new Error(`GitHub API HTTP ${res.status}`);
    if (body.errors && body.errors.length) {
      throw new Error('GitHub GraphQL hatası: ' + body.errors.map(e => e.message).join('; '));
    }
    check(isObj(body.data), 'GraphQL data');
    return body.data;
  }
}

// Flattens a contributionCalendar. Missing weeks/days are an error, never an empty calendar.
function flattenDays(calendar, withLevel, path) {
  check(isObj(calendar) && isNum(calendar.totalContributions), `${path}.totalContributions`);
  check(isArr(calendar.weeks) && calendar.weeks.length > 0, `${path}.weeks`);
  return calendar.weeks.flatMap((week, w) => {
    check(isObj(week) && isArr(week.contributionDays), `${path}.weeks[${w}].contributionDays`);
    return week.contributionDays.map((d, i) => {
      check(isObj(d) && isStr(d.date) && isNum(d.contributionCount), `${path}.weeks[${w}].contributionDays[${i}]`);
      const day = { date: d.date, count: d.contributionCount };
      if (withLevel) {
        check(isStr(d.contributionLevel), `${path}.weeks[${w}].contributionDays[${i}].contributionLevel`);
        day.level = d.contributionLevel;
      }
      return day;
    });
  });
}

function repoFromNode(n, i) {
  check(isObj(n) && isStr(n.name), `repositories.nodes[${i}].name`);
  check(typeof n.isArchived === 'boolean', `${n.name}.isArchived`);
  check(isNum(n.stargazerCount), `${n.name}.stargazerCount`);
  check(isObj(n.languages) && isNum(n.languages.totalCount) && isArr(n.languages.edges), `${n.name}.languages`);
  if (n.languages.totalCount > LANGUAGE_PAGE) {
    console.warn(`UYARI: "${n.name}" reposunda ${n.languages.totalCount} dil var; yalnızca ilk ${LANGUAGE_PAGE} dil kullanıldı.`);
  }
  return {
    name: n.name,
    isArchived: n.isArchived,
    stargazerCount: n.stargazerCount,
    languages: n.languages.edges.map((e, j) => {
      check(isObj(e) && isNum(e.size) && isObj(e.node) && isStr(e.node.name), `${n.name}.languages.edges[${j}]`);
      check(e.node.color === null || isStr(e.node.color), `${n.name}.languages.edges[${j}].color`);
      return { name: e.node.name, color: e.node.color, size: e.size };
    }),
  };
}

// Returns the raw snapshot consumed by lib/metrics.js. The same shape is used by --fixture files.
async function fetchRaw(login, token, now = new Date()) {
  const nowIso = now.toISOString();
  const year = now.getUTCFullYear();
  const thisYearFrom = `${year}-01-01T00:00:00Z`;
  const lastYearFrom = new Date(now.getTime() - 365 * 864e5).toISOString();

  const profile = await gql(PROFILE_QUERY, { login, thisYearFrom, lastYearFrom, now: nowIso }, token);
  const user = profile.user;
  check(isObj(user), 'user');
  check(isStr(user.login) && isStr(user.createdAt), 'user.login/createdAt');
  check(isObj(user.pullRequests) && isNum(user.pullRequests.totalCount), 'pullRequests.totalCount');
  check(isObj(user.issues) && isNum(user.issues.totalCount), 'issues.totalCount');
  check(isObj(user.repositoriesContributedTo) && isNum(user.repositoriesContributedTo.totalCount),
    'repositoriesContributedTo.totalCount');
  check(isObj(user.thisYear) && isNum(user.thisYear.totalCommitContributions), 'thisYear.totalCommitContributions');
  check(isObj(user.thisYear) && isArr(user.thisYear.contributionYears), 'contributionYears');
  check(isObj(user.lastYear), 'lastYear');
  const years = [...user.thisYear.contributionYears].sort((a, b) => a - b);

  const repos = [];
  let after = null;
  do {
    const conn = (await gql(REPOS_QUERY, { login, after }, token)).user;
    check(isObj(conn) && isObj(conn.repositories), 'repositories');
    const page = conn.repositories;
    check(isArr(page.nodes), 'repositories.nodes');
    check(isObj(page.pageInfo) && typeof page.pageInfo.hasNextPage === 'boolean', 'repositories.pageInfo.hasNextPage');
    page.nodes.forEach((n, i) => repos.push(repoFromNode(n, repos.length + i)));
    if (page.pageInfo.hasNextPage) check(isStr(page.pageInfo.endCursor), 'repositories.pageInfo.endCursor');
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  // One contributionsCollection call per year, as required for the streak.
  const yearCalendars = [];
  for (const y of years) {
    const from = `${y}-01-01T00:00:00Z`;
    const to = y === year ? nowIso : `${y}-12-31T23:59:59Z`;
    const data = await gql(YEAR_QUERY, { login, from, to }, token);
    const coll = data.user && data.user.contributionsCollection;
    check(isObj(coll), `year ${y}.contributionsCollection`);
    yearCalendars.push({
      year: y,
      totalContributions: coll.contributionCalendar && coll.contributionCalendar.totalContributions,
      days: flattenDays(coll.contributionCalendar, false, `year ${y}.contributionCalendar`),
    });
  }

  const last = user.lastYear;
  const raw = {
    login: user.login,
    createdAt: user.createdAt,
    fetchedAt: nowIso,
    pullRequests: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    commitsThisYear: user.thisYear.totalCommitContributions,
    reposLastYear: user.repositoriesContributedTo.totalCount,
    contributionYears: years,
    yearCalendars,
    heatmap: {
      totalContributions: last.contributionCalendar && last.contributionCalendar.totalContributions,
      days: flattenDays(last.contributionCalendar, true, 'lastYear.contributionCalendar'),
    },
    repos,
  };
  // Final gate: nothing downstream sees a snapshot that is not complete.
  assertSnapshot(raw);
  return raw;
}

module.exports = { fetchRaw };
