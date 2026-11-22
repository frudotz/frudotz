'use strict';
// SVG renderers. Output is self-contained: system font stacks only, no external resources, no scripts.
// The heatmap keeps the visual design of pwtool/gen-contrib.js; only the data source changed.

const MONO = "ui-monospace, SFMono-Regular, 'Cascadia Mono', Consolas, 'Liberation Mono', monospace";
const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const FALLBACK_LANG_COLOR = '#8B8B8B';
const LOCALE = { tr: 'tr-TR', en: 'en-GB' };

const MONTHS = {
  tr: {
    short: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    long: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  },
  en: {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

// Stats card palette: same paper/ink family as the studio heatmap; the card has its own background.
const PAL = {
  light: { bg: '#F4EFE6', ink: '#141217', sub: '#4A443C', rule: '#D9D0C1', track: '#E4DCCD', accent: '#FF5B3A' },
  dark: { bg: '#141217', ink: '#F4EFE6', sub: '#B9B0A3', rule: '#34303A', track: '#26222B', accent: '#FF5B3A' },
};

// Heatmap palette, taken unchanged from pwtool/gen-contrib.js.
const HEAT_PAL = {
  light: { bg: '#F4EFE6', ink: '#141217', sub: '#4A443C', rule: '#D9D0C1', lv: ['#E4DCCD', '#FFD3C4', '#FFA088', '#FF5B3A', '#B8361B'] },
  dark: { bg: '#141217', ink: '#F4EFE6', sub: '#B9B0A3', rule: '#34303A', lv: ['#26222B', '#5A2B22', '#9C3B26', '#FF5B3A', '#FFB29C'] },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function T(x, y, s, o = {}) {
  return `<text x="${x}" y="${y}" font-family="${o.font || SANS}" font-size="${o.size || 13}" font-weight="${o.weight || 400}" fill="${o.fill}" text-anchor="${o.anchor || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
}

function parts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}
function fmtLong(iso, lang) {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[lang].long[m - 1]} ${y}`;
}
function fmtShort(iso, lang) {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[lang].short[m - 1]} ${y}`;
}
const fmtInt = (n, lang) => Number(n || 0).toLocaleString(LOCALE[lang]);
const fmtPct = (p, lang) => p.toLocaleString(LOCALE[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
const clip = (s, max) => (s.length > max ? s.slice(0, max - 1) + '…' : s);
const langColor = it => it.color || FALLBACK_LANG_COLOR;

const STR = {
  tr: {
    kicker: 'FRUDOTZ · GITHUB İSTATİSTİKLERİ',
    title: 'Katkı ve dil özeti',
    updated: d => `Güncellendi: ${fmtLong(d, 'tr')}`,
    sec: ['01 · GENEL', '02 · SERİ', '03 · DİLLER'],
    metrics: ['Kazanılan yıldız', 'Commit · bu yıl', 'Pull request · toplam', 'Issue · toplam', 'Katkı repo · son 1 yıl'],
    streak: {
      total: 'Toplam katkı',
      current: 'Şu anki seri · gün',
      longest: 'En uzun seri · gün',
      none: 'Aktif seri yok',
      todayNote: 'Bugün henüz katkı yok; seri dünden hesaplanıyor.',
    },
    noLang: 'Dil verisi bulunamadı.',
    footer: 'Yalnızca herkese açık veriler. Dil payları tüm dil baytları üzerinden; çubuğun boş kısmı ilk 6 dışındaki diller.',
    a11yTitle: 'GitHub istatistik kartı: katkı, seri ve diller',
    a11yDesc: m => `Kazanılan ${fmtInt(m.stats.stars, 'tr')} yıldız; bu yıl ${fmtInt(m.stats.commitsThisYear, 'tr')} commit, ${fmtInt(m.stats.pullRequests, 'tr')} pull request, ${fmtInt(m.stats.issues, 'tr')} issue; son bir yılda ${fmtInt(m.stats.reposLastYear, 'tr')} repoya katkı. Toplam ${fmtInt(m.streak.total, 'tr')} katkı; şu anki seri ${m.streak.current.length} gün, en uzun seri ${m.streak.longest.length} gün. Başlıca diller: ${m.languages.items.map(l => `${l.name} ${fmtPct(l.pct, 'tr')}`).join(', ')}.`,
  },
  en: {
    kicker: 'FRUDOTZ · GITHUB STATS',
    title: 'Activity and language summary',
    updated: d => `Updated: ${fmtLong(d, 'en')}`,
    sec: ['01 · OVERVIEW', '02 · STREAK', '03 · LANGUAGES'],
    metrics: ['Stars earned', 'Commits · this year', 'Pull requests · total', 'Issues · total', 'Repos contributed · 1 yr'],
    streak: {
      total: 'Total contributions',
      current: 'Current streak · days',
      longest: 'Longest streak · days',
      none: 'No active streak',
      todayNote: 'No contributions yet today; the streak is counted from yesterday.',
    },
    noLang: 'No language data found.',
    footer: 'Public data only. Language shares are based on all language bytes; the empty part of the bar is languages beyond the top 6.',
    a11yTitle: 'GitHub stats card: contributions, streak and languages',
    a11yDesc: m => `${fmtInt(m.stats.stars, 'en')} stars earned; this year ${fmtInt(m.stats.commitsThisYear, 'en')} commits, ${fmtInt(m.stats.pullRequests, 'en')} pull requests, ${fmtInt(m.stats.issues, 'en')} issues; ${fmtInt(m.stats.reposLastYear, 'en')} repositories contributed to in the last year. ${fmtInt(m.streak.total, 'en')} contributions in total; current streak ${m.streak.current.length} days, longest streak ${m.streak.longest.length} days. Top languages: ${m.languages.items.map(l => `${l.name} ${fmtPct(l.pct, 'en')}`).join(', ')}.`,
  },
};

function renderStats(m, lang, theme, updated) {
  const t = STR[lang];
  const p = PAL[theme];
  const W = 1200, H = 716, X = 56, IW = 1088, R = X + IW;

  const section = (y, label) =>
    T(X, y, label, { font: MONO, size: 12, weight: 600, fill: p.sub, ls: 1.5 }) +
    `<line x1="${X}" y1="${y + 12}" x2="${R}" y2="${y + 12}" stroke="${p.rule}" stroke-width="1"/>`;

  let b = `<rect width="${W}" height="${H}" rx="24" fill="${p.bg}"/>`;
  b += T(X, 58, t.kicker, { font: MONO, size: 13, weight: 600, fill: p.sub, ls: 2 });
  b += T(R, 58, t.updated(updated), { font: MONO, size: 13, fill: p.sub, anchor: 'end' });
  b += T(X, 104, t.title, { size: 32, weight: 700, fill: p.ink });

  // 01 Stats
  b += section(150, t.sec[0]);
  const s = m.stats;
  const metricValues = [s.stars, s.commitsThisYear, s.pullRequests, s.issues, s.reposLastYear];
  metricValues.forEach((v, i) => {
    const x = X + i * 221;
    b += `<rect x="${x}" y="184" width="28" height="4" rx="2" fill="${p.accent}"/>`;
    b += T(x, 236, fmtInt(v, lang), { size: 40, weight: 700, fill: p.ink });
    b += T(x, 262, t.metrics[i], { size: 13, fill: p.sub });
  });

  // 02 Streak
  b += section(320, t.sec[1]);
  const st = m.streak;
  const range = seg => `${fmtShort(seg.start, lang)} – ${fmtShort(seg.end, lang)}`;
  const streakBlocks = [
    { label: t.streak.total, value: fmtInt(st.total, lang), sub: st.firstYear && st.lastYear ? `${st.firstYear} – ${st.lastYear}` : t.streak.none },
    { label: t.streak.current, value: String(st.current.length), sub: st.current.length ? range(st.current) : t.streak.none },
    { label: t.streak.longest, value: String(st.longest.length), sub: st.longest.length ? range(st.longest) : t.streak.none },
  ];
  streakBlocks.forEach((k, i) => {
    const x = X + i * 373;
    b += T(x, 366, k.label, { size: 13, weight: 600, fill: p.sub });
    b += T(x, 414, k.value, { size: 52, weight: 700, fill: p.ink });
    b += T(x, 442, k.sub, { font: MONO, size: 13, fill: p.sub });
  });
  if (st.todayZero && st.current.length) b += T(X, 480, t.streak.todayNote, { size: 12, fill: p.sub });

  // 03 Languages
  b += section(512, t.sec[2]);
  const items = m.languages.items;
  if (items.length) {
    const BAR_Y = 532, BAR_H = 16;
    b += `<clipPath id="bar"><rect x="${X}" y="${BAR_Y}" width="${IW}" height="${BAR_H}" rx="8"/></clipPath>`;
    b += `<rect x="${X}" y="${BAR_Y}" width="${IW}" height="${BAR_H}" rx="8" fill="${p.track}"/>`;
    let x = X;
    let segs = '';
    for (const it of items) {
      const w = (IW * it.pct) / 100;
      segs += `<rect x="${x.toFixed(2)}" y="${BAR_Y}" width="${w.toFixed(2)}" height="${BAR_H}" fill="${langColor(it)}"/>`;
      x += w;
    }
    b += `<g clip-path="url(#bar)">${segs}</g>`;
    items.forEach((it, i) => {
      const x0 = X + (i % 3) * 363;
      const y = 588 + Math.floor(i / 3) * 36;
      b += `<circle cx="${x0 + 6}" cy="${y - 5}" r="6" fill="${langColor(it)}"/>`;
      b += T(x0 + 20, y, clip(it.name, 26), { size: 15, weight: 600, fill: p.ink });
      b += T(x0 + 340, y, fmtPct(it.pct, lang), { font: MONO, size: 14, weight: 600, fill: p.ink, anchor: 'end' });
    });
  } else {
    b += T(X, 572, t.noLang, { size: 14, fill: p.sub });
  }

  // Footer
  b += `<line x1="${X}" y1="660" x2="${R}" y2="660" stroke="${p.rule}" stroke-width="1"/>`;
  b += T(X, 688, t.footer, { size: 12, fill: p.sub });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">\n<title id="t">${esc(t.a11yTitle)}</title>\n<desc id="d">${esc(t.a11yDesc(m))}</desc>\n${b}\n</svg>\n`;
}

// Heatmap: port of pwtool/gen-contrib.js svg(). Texts are kept; the summary text uses the live totals.
const HEAT_TEXT = {
  tr: {
    months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    days: { 1: 'Pzt', 3: 'Çar', 5: 'Cum' },
    kicker: 'GITHUB · HERKESE AÇIK KATKI ETKİNLİĞİ',
    title: n => `Son 12 ayda ${n} herkese açık katkı`,
    range: (a, b) => `${a} – ${b}`,
    snap: s => `anlık görüntü: ${s}`,
    less: 'Az', more: 'Çok',
    note: 'Etkinlik görünümüdür; beceri ya da kalite ölçüsü değildir.',
    fmtN: n => n.toLocaleString('tr-TR'),
    svgTitle: 'Herkese açık GitHub katkı etkinliği ısı haritası',
    desc: (s, fd) => `frudotz kullanıcısının GitHub profilinde herkese açık görünen katkı takvimi, ${fd(s.first)} – ${fd(s.last)} (${s.days} gün, ${fd(s.snapshot)} tarihli anlık görüntü). Toplam ${s.total.toLocaleString('tr-TR')} katkı; ${s.active} günde en az bir katkı var. Her kare bir gün, sütunlar haftalar (Pazar'dan başlar); renk koyulaştıkça o günkü katkı sayısı artar (5 düzey, Az'dan Çok'a). Beceri ya da kalite ölçüsü değildir.`,
  },
  en: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: { 1: 'Mon', 3: 'Wed', 5: 'Fri' },
    kicker: 'GITHUB · PUBLIC CONTRIBUTION ACTIVITY',
    title: n => `${n} public contributions in the last 12 months`,
    range: (a, b) => `${a} – ${b}`,
    snap: s => `snapshot: ${s}`,
    less: 'Less', more: 'More',
    note: 'A view of activity, not a measure of skill or quality.',
    fmtN: n => n.toLocaleString('en-GB'),
    svgTitle: 'Public GitHub contribution activity heatmap',
    desc: (s, fd) => `Public contribution calendar shown on the GitHub profile of frudotz, ${fd(s.first)} to ${fd(s.last)} (${s.days} days, snapshot taken ${fd(s.snapshot)}). ${s.total.toLocaleString('en-GB')} contributions in total; at least one contribution on ${s.active} days. Each square is a day and each column a week starting on Sunday; darker squares mean more contributions that day (5 levels, Less to More). Not a measure of skill or quality.`,
  },
};

function renderHeatmap(h, lang, theme, updated) {
  const t = HEAT_TEXT[lang];
  const p = HEAT_PAL[theme];
  const list = h.days;
  const first = list[0].date;
  const last = list[list.length - 1].date;
  const summary = { first, last, days: list.length, total: h.total, active: h.active, snapshot: updated };
  const fd = s => fmtLong(s, lang);

  const D = s => new Date(s + 'T00:00:00Z');
  const start = D(first);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const col = d => Math.floor((D(d.date) - start) / 864e5 / 7);
  const row = d => D(d.date).getUTCDay();
  const weeks = col(list[list.length - 1]) + 1;
  const CELL = 14, GAP = 3, STEP = CELL + GAP, X0 = 64, Y0 = 136;
  const W = X0 + weeks * STEP + 40, H = Y0 + 7 * STEP + 74;

  const T2 = (x, y, s, o = {}) => T(x, y, s, o);
  let b = `<rect width="${W}" height="${H}" rx="24" fill="${p.bg}"/>`;
  b += T2(X0 - 24, 50, t.kicker, { font: MONO, size: 13, weight: 600, fill: p.sub, ls: 2 });
  b += T2(X0 - 24, 86, t.title(t.fmtN(h.total)), { size: 26, weight: 650, fill: p.ink });
  b += T2(W - 40, 50, t.range(fd(first), fd(last)), { font: MONO, size: 13, weight: 600, fill: p.ink, anchor: 'end' });
  b += T2(W - 40, 72, t.snap(fd(updated)), { font: MONO, size: 12, fill: p.sub, anchor: 'end' });

  // Month labels: first column whose first day starts a new month.
  let prev = null;
  for (let c = 0; c < weeks; c++) {
    const dd = list.find(d => col(d) === c);
    if (!dd) continue;
    const m = D(dd.date).getUTCMonth();
    if (prev !== null && m !== prev && c < weeks - 1) b += T2(X0 + c * STEP, Y0 - 12, t.months[m], { font: MONO, size: 12, fill: p.sub });
    prev = m;
  }
  for (const [r, s] of Object.entries(t.days)) {
    b += T2(X0 - 10, Y0 + r * STEP + CELL - 3, s, { font: MONO, size: 11, fill: p.sub, anchor: 'end' });
  }
  b += '<g>' + list.map(d => `<rect x="${X0 + col(d) * STEP}" y="${Y0 + row(d) * STEP}" width="${CELL}" height="${CELL}" rx="3" fill="${p.lv[d.level]}"/>`).join('') + '</g>';
  const yL = Y0 + 7 * STEP + 34;
  b += `<line x1="${X0 - 24}" y1="${yL - 22}" x2="${W - 40}" y2="${yL - 22}" stroke="${p.rule}" stroke-width="1"/>`;
  b += T2(X0 - 24, yL + 6, t.note, { size: 13, fill: p.sub });
  const lx = W - 40 - 5 * STEP - 44;
  b += T2(lx - 8, yL + 6, t.less, { font: MONO, size: 12, fill: p.sub, anchor: 'end' });
  p.lv.forEach((c, i) => { b += `<rect x="${lx + i * STEP}" y="${yL - 6}" width="${CELL}" height="${CELL}" rx="3" fill="${c}"/>`; });
  b += T2(lx + 5 * STEP + 6, yL + 6, t.more, { font: MONO, size: 12, fill: p.sub });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">\n<title id="t">${esc(t.svgTitle)}</title>\n<desc id="d">${esc(t.desc(summary, fd))}</desc>\n${b}\n</svg>\n`;
}

module.exports = { renderStats, renderHeatmap };
