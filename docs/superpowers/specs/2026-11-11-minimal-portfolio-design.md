# Minimal personal page — design

Date: 2026-11-11
Status: approved in chat, awaiting written-spec review

## Goal

A one-screen personal page ("online business card") hosted on GitHub Pages.
It shows who the owner is and where to find them. Nothing else.

**Audience:** anyone who gets the link (peers, recruiters, people met online).

**Success criteria**

- Live at `https://<username>.github.io` from a plain push to `main`.
- Loads fast: one HTML request, no external fonts, scripts, or images required.
- The owner can change name, bio, and links by editing marked spots in one file.
- Reads well on a 375px phone and on desktop, in light and dark mode.
- Text contrast meets WCAG 2.1 AA.

## Decisions (from the user)

| Topic | Decision |
|---|---|
| Purpose | Personal page / online business card |
| Content | Name, short intro, social links. No projects, no blog |
| Language | English |
| Approach | Plain HTML + inline CSS, no build step, no JavaScript |
| Visual style | As shown in the approved mockup (see Layout and Style) |

## Assumptions (proposed by Claude, not objected to)

- Fits in one viewport; no scrolling on common screens.
- No avatar by default.
- Dark mode follows the OS (`prefers-color-scheme`); no toggle.
- No analytics or tracking.
- Placeholder content (`Your Name`, `username`) unless the owner supplies real values.
- Claude creates files locally only; pushing to GitHub happens only with the owner's go-ahead.

## Files

```
index.html   the whole page; CSS in a <style> block
README.md    how to edit content and deploy
```

Every owner-editable value in `index.html` sits next to an `<!-- EDIT -->` comment:
page title, meta description, Open Graph title/description, favicon letter, name,
role line, bio, and each link URL.

## Layout

- One `<main>` column, `max-width: 36rem`, centered horizontally, text left-aligned.
- Vertically placed above center: top padding roughly `20vh` on desktop, fixed
  `~4.5rem` on narrow screens.
- Side gutter of at least `1.5rem` on mobile; no horizontal scroll at 320px.
- Order, top to bottom:
  1. `<h1>` name.
  2. `<p>` role line, secondary color, e.g. "Software engineer based in Hanoi".
  3. `<p>` bio, 2–3 sentences.
  4. `<nav aria-label="Links">` with text links separated by a `·` (marked
     `aria-hidden="true"`): GitHub · LinkedIn · Email (`mailto:`).
- No header, footer, or menu.

## Style

**Typography:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
Fluid sizes via `clamp()`:

| Element | Size |
|---|---|
| Name | `clamp(1.5rem, 4vw, 1.75rem)`, weight 500, letter-spacing -0.01em |
| Role, bio | `clamp(0.875rem, 2.5vw, 0.95rem)`, line-height 1.65 |
| Links | `0.875rem` |

**Color:** three tokens as CSS custom properties on `:root`.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FAF9F6` | `#161615` |
| `--fg` | `#1C1B19` | `#ECEAE4` |
| `--muted` | `#6B6963` | `#9C9A93` |
| `--rule` (underline) | `#B4B2A9` | `#5F5E5A` |

Dark values apply under `@media (prefers-color-scheme: dark)`.
Also set `color-scheme: light dark`.

**Links:** inherit `--fg`; 1px underline in `--rule`, offset 3px.
On hover the underline takes `--fg`. `:focus-visible` shows a 2px `--fg`
outline with 3px offset.

**Motion:** a 400ms fade-in of `<main>` on load, disabled under
`prefers-reduced-motion: reduce`.

## Head metadata

- `lang="en"`, UTF-8 charset, responsive viewport meta.
- `<title>`: owner's name.
- `meta name="description"`: the role line.
- Open Graph: `og:title`, `og:description`, `og:type=website`.
- Favicon: inline SVG data URI showing the owner's initial.

## Deploy (documented in README)

1. Create a public repo named `<username>.github.io`.
2. Push `main`.
3. Settings → Pages → Source: *Deploy from a branch*, `main` / `(root)`.
4. Site appears at `https://<username>.github.io` within a minute or two.

Also covers using a project repo instead (site at `/<repo>/`); the page uses
no absolute paths, so it works in both cases.

## Verification

- Open `index.html` in the built-in browser at desktop width and at 375px,
  light and dark; compare against the approved mockup.
- Check there is no horizontal scroll at 320px.
- Check contrast of `--fg` and `--muted` on `--bg` in both modes is ≥ 4.5:1.
- Validate the HTML (no errors from the W3C validator or `html-validate`).
- Tab through links: visible focus ring on each.

## Out of scope

Projects list, blog, contact form, language toggle, theme toggle, analytics,
custom domain setup, CI/build tooling.
