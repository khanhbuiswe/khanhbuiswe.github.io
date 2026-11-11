import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const PALETTE = {
  light: { bg: '#FAF9F6', fg: '#1C1B19', muted: '#6B6963', rule: '#B4B2A9' },
  dark: { bg: '#161615', fg: '#ECEAE4', muted: '#9C9A93', rule: '#5F5E5A' },
};
const LINK_COUNT = 3;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Body of the first `{...}` after `start`, honoring nested braces.
function block(css, start) {
  const open = css.indexOf('{', start);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return '';
}

function ruleBody(css, selectorRe) {
  const m = selectorRe.exec(css);
  return m ? block(css, m.index) : '';
}

function tokens(body) {
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, k, v]) => [k, v.toUpperCase()]),
  );
}

function styleOf(html) {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1] : '';
}

// Every rule the page must satisfy. Throws on the first violation.
function checkPage(html) {
  const css = styleOf(html);

  assert.doesNotMatch(html, /<script/i, 'no scripts');
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:/i, 'no external stylesheets');
  assert.doesNotMatch(html, /\ssrc=["']https?:/i, 'no external src');
  assert.doesNotMatch(html, /url\(\s*["']?https?:/i, 'no external css url()');

  for (const re of [
    /<html lang="en">/,
    /<meta charset="utf-8">/i,
    /name="viewport"/,
    /<title>[^<]+<\/title>/,
    /name="description" content="[^"]+"/,
    /property="og:title" content="[^"]+"/,
    /property="og:description" content="[^"]+"/,
    /property="og:type" content="website"/,
    /rel="icon"[^>]+data:image\/svg\+xml/,
  ]) assert.match(html, re);

  assert.match(html, /<main[\s>]/);
  assert.match(html, /<h1>[^<]+<\/h1>/);
  assert.match(html, /class="role">[^<]+</);
  assert.match(html, /class="bio">[^<]+</);
  const nav = html.match(/<nav aria-label="Links">([\s\S]*?)<\/nav>/);
  assert.ok(nav, 'links nav');
  assert.match(nav[1], /href="mailto:[^"]+"/, 'email link');
  const links = nav[1].match(/<a\s/g) || [];
  const seps = nav[1].match(/<span aria-hidden="true">·<\/span>/g) || [];
  assert.equal(seps.length, links.length - 1, 'one separator between each link');

  for (const tag of ['<title>', 'name="description"', 'property="og:title"',
    'property="og:description"', 'rel="icon"', '<h1>', 'class="role"', 'class="bio"']) {
    assert.ok(markedBefore(html, tag), `EDIT marker before ${tag}`);
  }
  for (const a of html.matchAll(/<a\s/g)) {
    assert.ok(markedBefore(html, a.index), 'EDIT marker before each link');
  }

  assert.match(css, /main\s*\{[^}]*max-width:\s*36rem/);
  assert.match(css, /color-scheme:\s*light dark/);
  assert.match(css, /clamp\(/);

  const focus = ruleBody(css, /a:focus-visible\s*(?=\{)/);
  assert.match(focus, /outline:\s*2px solid var\(--fg\)/, 'visible focus outline');

  const reduced = ruleBody(css, /@media \(prefers-reduced-motion: reduce\)\s*(?=\{)/);
  assert.match(reduced, /main\s*\{[^}]*animation:\s*none/, 'reduced motion stops fade-in');

  const wrap = css.match(/([^{}]+)\{[^}]*overflow-wrap:\s*anywhere/);
  assert.ok(wrap, 'overflow-wrap rule');
  for (const sel of ['h1', '.role', '.bio', 'nav']) {
    assert.ok(wrap[1].split(',').map((s) => s.trim()).includes(sel), `${sel} wraps long text`);
  }

  const light = tokens(ruleBody(css, /:root\s*(?=\{)/));
  const dark = tokens(ruleBody(ruleBody(css, /@media \(prefers-color-scheme: dark\)\s*(?=\{)/), /:root\s*(?=\{)/));
  for (const [mode, got] of [['light', light], ['dark', dark]]) {
    for (const [k, v] of Object.entries(PALETTE[mode])) assert.equal(got[k], v, `${mode} --${k}`);
    assert.ok(contrast(got.fg, got.bg) >= 4.5, `${mode} fg/bg contrast`);
    assert.ok(contrast(got.muted, got.bg) >= 4.5, `${mode} muted/bg contrast`);
  }
}

// True when the nearest non-blank text before `at` (string tag or index) ends with an EDIT marker
// on the same line or the line above.
function markedBefore(html, at) {
  const idx = typeof at === 'number' ? at : html.indexOf(at);
  if (idx < 0) return false;
  const before = html.slice(0, idx);
  const lines = before.split('\n');
  const near = lines.slice(-2).join('\n');
  return near.includes('<!-- EDIT -->');
}

const mutate = (from, to) => {
  assert.ok(page.includes(from) || from instanceof RegExp, `mutation source missing: ${from}`);
  return page.replace(from, to);
};

test('shipped page passes every rule', () => {
  checkPage(page);
  assert.equal((page.match(/<a\s/g) || []).length, LINK_COUNT);
});

test('page still passes after the owner edits their info', () => {
  const edited = page
    .replaceAll('Your Name', 'Nguyen Van A')
    .replaceAll('you@example.com', 'a@nguyen.dev')
    .replaceAll('username', 'nguyenvana');
  checkPage(edited);
});

test('rejects swapped light and dark palettes', () => {
  const swapped = page
    .replace('--bg: #FAF9F6', '--bg: TMP').replace('--bg: #161615', '--bg: #FAF9F6').replace('--bg: TMP', '--bg: #161615');
  assert.throws(() => checkPage(swapped), /light --bg/);
});

test('rejects muted color with too little contrast', () => {
  assert.throws(() => checkPage(mutate('--muted: #6B6963', '--muted: #B4B2A9')), /light --muted/);
});

test('rejects a missing dark palette', () => {
  assert.throws(() => checkPage(page.replace(/@media \(prefers-color-scheme: dark\)\s*\{[\s\S]*?\}\s*\}/, '')), /dark --bg/);
});

test('rejects an empty reduced-motion block', () => {
  assert.throws(() => checkPage(page.replace(/(@media \(prefers-reduced-motion: reduce\)\s*\{)[\s\S]*?\}\s*\}/, '$1}')), /reduced motion/);
});

test('rejects a focus style without an outline', () => {
  assert.throws(() => checkPage(mutate('outline: 2px solid var(--fg);', 'outline: 0;')), /focus outline/);
});

test('rejects a link without an EDIT marker', () => {
  assert.throws(() => checkPage(mutate('<!-- EDIT --> <a href="https://github.com', '<a href="https://github.com')), /EDIT marker before each link/);
});

test('rejects nav that does not wrap long link text', () => {
  const css = styleOf(page);
  const sel = css.match(/([^{}]+)\{[^}]*overflow-wrap:\s*anywhere/)[1];
  const without = sel.split(',').filter((s) => s.trim() !== 'nav').join(',');
  assert.throws(() => checkPage(page.replace(sel, without.endsWith(' ') ? without : without + ' ')), /nav wraps/);
});
