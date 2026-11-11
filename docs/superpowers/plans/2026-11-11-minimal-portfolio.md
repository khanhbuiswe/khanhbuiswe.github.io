# Minimal Personal Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-screen personal page (name, role, bio, links) served by GitHub Pages from `index.html` at the repo root.

**Architecture:** One static `index.html` with an inline `<style>` block, no JavaScript, no build. A zero-dependency Node script (`tests/check.mjs`) asserts the spec's structural rules and color contrast; `html-validate` (via `npx`) checks markup; the built-in browser checks layout.

**Tech Stack:** HTML5, CSS (custom properties, `clamp()`, media queries), Node 22 (`node:test`, `node:assert`) for checks only.

**Spec:** `docs/superpowers/specs/2026-11-11-minimal-portfolio-design.md`

## Global Constraints

- No `<script>` elements; no external requests (no `http(s)://` in `src`, `<link href>`, or CSS `url()`). Outbound `<a href>` links are allowed.
- Content language English; `<html lang="en">`.
- Font stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Colors exactly: light `--bg #FAF9F6`, `--fg #1C1B19`, `--muted #6B6963`, `--rule #B4B2A9`; dark `--bg #161615`, `--fg #ECEAE4`, `--muted #9C9A93`, `--rule #5F5E5A`.
- `--fg` and `--muted` on `--bg` ≥ 4.5:1 in both modes.
- `main` `max-width: 36rem`; no horizontal scroll at 320px.
- Every owner-editable value has an `<!-- EDIT -->` comment beside it.
- Placeholder content: name `Your Name`, username `username`, email `you@example.com`.
- No absolute paths (works at `/` and at `/<repo>/`).

## Review Focus

- A long name or bio (e.g. 40-char name, 5-sentence bio) must wrap, not overflow → covered by Task 1 Step 6 browser check with long text.
- A 320px viewport must not scroll horizontally → Task 1 Step 6.
- Keyboard users must see focus on every link → `:focus-visible` rule asserted in Task 1 tests, observed in Step 6.
- `prefers-reduced-motion: reduce` must disable the fade-in → asserted in Task 1 tests.
- Dark-mode users get dark colors without a toggle → dark-palette contrast asserted in Task 1 tests, observed in Step 6.

---

### Task 1: The page and its checks

**Files:**
- Create: `tests/check.mjs`
- Create: `index.html`
- Create: `package.json` (only `"type": "module"` and script `"test": "node --test tests/"`; no dependencies)

**Interfaces:**
- Produces: `index.html` with element ids/classes used by README: `<main>`, `<h1>` (name), `p.role`, `p.bio`, `nav[aria-label="Links"]`.

- [ ] **Step 1: Write the failing checks in `tests/check.mjs`**

Read `index.html` as a string with `readFileSync`. Tests (`node:test`):

```js
test('no scripts and no external resources', () => {
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(html, /\ssrc=["']https?:/i);
  assert.doesNotMatch(html, /url\(\s*["']?https?:/i);
});
test('head metadata', () => {
  for (const re of [/<html lang="en">/, /<meta charset="utf-8">/i,
    /name="viewport"/, /<title>Your Name<\/title>/, /name="description"/,
    /property="og:title"/, /property="og:description"/,
    /property="og:type" content="website"/, /rel="icon"[^>]+data:image\/svg\+xml/])
    assert.match(html, re);
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
  for (const re of [/max-width:\s*36rem/, /color-scheme:\s*light dark/,
    /@media \(prefers-color-scheme: dark\)/, /:focus-visible/,
    /@media \(prefers-reduced-motion: reduce\)/, /clamp\(/])
    assert.match(html, re);
});
test('palette and contrast', () => {
  // exact hex values from Global Constraints must appear
  // contrast(fg,bg) and contrast(muted,bg) >= 4.5 for both palettes
});
```

Implement `contrast(a, b)` in the test file with the WCAG relative-luminance formula (sRGB → linear: `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4`; `L = 0.2126R + 0.7152G + 0.0722B`; ratio `(L1+0.05)/(L2+0.05)` with L1 the lighter). The palette test asserts each of the 8 hex values is present (case-insensitive) and the four contrast ratios are ≥ 4.5.

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `ENOENT ... index.html`.

- [ ] **Step 3: Write `index.html`**

Follow the spec's Layout, Style, and Head metadata sections exactly. Placeholder copy (exact):
- Role: `Software engineer based in Hanoi`
- Bio: `I build small, fast tools for the web. Currently working on video and ad tech. I like simple things that do one job well.`
- Links: `https://github.com/username`, `https://www.linkedin.com/in/username`, `mailto:you@example.com`

Choices left to the implementer: CSS ordering and selector names beyond those listed in Interfaces. Top spacing: `padding-top: 20vh` with `@media (max-width: 480px) { padding-top: 4.5rem }`. Fade-in via `@keyframes` on `main`, `400ms ease-out`, set to `animation: none` under reduced motion. Favicon: SVG with the letter `Y` in `--fg`-equivalent `#1C1B19`, URL-encoded in the `href`.

- [ ] **Step 4: Run checks and validator**

Run: `npm test`
Expected: all tests PASS.

Run: `npx --yes html-validate@9 index.html`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/check.mjs index.html
git commit -m "feat: add minimal personal page with structural checks"
```

- [ ] **Step 6: Visual check in the built-in browser**

Open `index.html` (file URL or `npx --yes serve@14 .`). At desktop width and at 375px and 320px, in light and dark (`resize_window` `colorScheme`):
- Matches the approved mockup (name, grey role line, bio, `GitHub · LinkedIn · Email`).
- `document.documentElement.scrollWidth <= innerWidth` at 320px.
- Tab moves through three links with a visible outline.
- Temporarily (in the browser via DevTools JS, not in the file) set a 40-character name and a 5-sentence bio: text wraps, no overflow.

Fix anything found, re-run Step 4, amend into a new commit `fix: ...` if needed.

---

### Task 2: README with editing and deploy steps

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the `<!-- EDIT -->` markers and element names from Task 1.

- [ ] **Step 1: Write `README.md`**

Sections: one-line description; "Edit your info" (search `<!-- EDIT -->` in `index.html`, list the 8+ fields); "Preview locally" (open the file, or `npx serve .`); "Deploy to GitHub Pages" (the 4 steps from the spec, plus the project-repo variant at `/<repo>/`); "Checks" (`npm test`, `npx html-validate index.html`).

- [ ] **Step 2: Verify**

Run: `grep -c "EDIT" README.md && grep -q "github.io" README.md && echo ok`
Expected: a count ≥ 1 and `ok`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with edit and deploy instructions"
```
