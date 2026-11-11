# Personal page

A one-screen personal page: name, a short intro, and links. One HTML file, no build, no JavaScript. Hosted on GitHub Pages.

## Edit your info

Open `index.html` and search for `<!-- EDIT -->`. Each marker sits next to something you should change:

| Where | What |
|---|---|
| `<title>` | Your name (browser tab) |
| `meta name="description"` | One-line summary (search results) |
| `og:title`, `og:description` | Preview text when the link is shared |
| `link rel="icon"` | Favicon: replace the `Y` just before `%3C/text` with your initial |
| `<h1>` | Your name |
| `p.role` | Role line, e.g. "Software engineer based in Hanoi" |
| `p.bio` | 2–3 sentences about you |
| `nav` links | GitHub, LinkedIn, and email URLs |

To add or remove a link, copy or delete one `<a>` together with a `<span aria-hidden="true">·</span>` separator.

Colors live at the top of the `<style>` block as `--bg`, `--fg`, `--muted`, and `--rule`, with a second set for dark mode.

## Preview locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
```

Then visit http://localhost:8765.

## Deploy to GitHub Pages

1. Create a public repository named `<username>.github.io`.
2. Push this folder to its `main` branch.
3. In the repository, go to **Settings → Pages → Build and deployment**, set **Source** to *Deploy from a branch*, and pick `main` / `(root)`.
4. After a minute or two the site is live at `https://<username>.github.io`.

Using a different repository name works too: the site then lives at `https://<username>.github.io/<repo>/`. The page uses no absolute paths, so nothing else changes.

## Checks

```bash
npm test
```

```bash
npx html-validate index.html
```

`npm test` checks structure, metadata, the `EDIT` markers, the CSS rules, and color contrast (WCAG AA) for both light and dark mode.
