import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const PALETTE = {
  light: { bg: '#FAF9F6', fg: '#1C1B19', muted: '#6B6963', rule: '#B4B2A9' },
  dark: { bg: '#161615', fg: '#ECEAE4', muted: '#9C9A93', rule: '#5F5E5A' },
};

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

test('no scripts and no external resources', () => {
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(html, /\ssrc=["']https?:/i);
  assert.doesNotMatch(html, /url\(\s*["']?https?:/i);
});

test('head metadata', () => {
  for (const re of [
    /<html lang="en">/,
    /<meta charset="utf-8">/i,
    /name="viewport"/,
    /<title>Your Name<\/title>/,
    /name="description"/,
    /property="og:title"/,
    /property="og:description"/,
    /property="og:type" content="website"/,
    /rel="icon"[^>]+data:image\/svg\+xml/,
  ]) assert.match(html, re);
});

test('structure', () => {
  assert.match(html, /<main[\s>]/);
  assert.match(html, /<h1>Your Name<\/h1>/);
  assert.match(html, /class="role"/);
  assert.match(html, /class="bio"/);
  assert.match(html, /<nav aria-label="Links">/);
  assert.match(html, /href="mailto:you@example\.com"/);
  assert.match(html, /<span aria-hidden="true">·<\/span>/);
});

test('edit markers', () => {
  assert.ok((html.match(/<!-- EDIT -->/g) || []).length >= 8);
});

test('css rules', () => {
  for (const re of [
    /max-width:\s*36rem/,
    /color-scheme:\s*light dark/,
    /@media \(prefers-color-scheme: dark\)/,
    /:focus-visible/,
    /@media \(prefers-reduced-motion: reduce\)/,
    /clamp\(/,
  ]) assert.match(html, re);
});

test('palette present and contrast meets WCAG AA', () => {
  for (const [mode, p] of Object.entries(PALETTE)) {
    for (const hex of Object.values(p)) {
      assert.match(html, new RegExp(hex, 'i'), `${mode} ${hex} missing`);
    }
    assert.ok(contrast(p.fg, p.bg) >= 4.5, `${mode} fg/bg`);
    assert.ok(contrast(p.muted, p.bg) >= 4.5, `${mode} muted/bg`);
  }
});
