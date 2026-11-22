'use strict';
// Writes an SVG only when its data-derived content changed. The displayed date is excluded from the
// signature, so a run with unchanged data never rewrites a file just because the date moved on.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SIG_RE = /<!-- sig: ([0-9a-f]{16}) -->/;
const REFERENCE_DATE = '1970-01-01'; // fixed date used only for computing the signature

function signatureOf(svg) {
  return crypto.createHash('sha256').update(svg).digest('hex').slice(0, 16);
}

// render(date) -> svg string. Returns true when the file was written.
function writeIfChanged(dir, name, render, updated) {
  const sig = signatureOf(render(REFERENCE_DATE));
  const file = path.join(dir, name);
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if ((prev.match(SIG_RE) || [])[1] === sig) return false;
  fs.writeFileSync(file, `${render(updated)}<!-- sig: ${sig} -->\n`);
  return true;
}

module.exports = { writeIfChanged, signatureOf, REFERENCE_DATE };
