# Portfolio

A zero-build, editorial-minimalist portfolio — plain HTML, CSS, and vanilla JavaScript.
No frameworks, no bundler, no dependencies. Inspired by
[siteinspire](https://www.siteinspire.com/), [minimalist.gallery](https://minimalist.gallery/),
and [recent.design](https://recent.design/).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure & content |
| `styles.css` | Design system (tokens, layout, components, motion) |
| `script.js` | Theme toggle, custom cursor, scroll-reveal, year |
| `assets/` | Favicon + social preview image |

## Customize

Everything you need to change is tagged with an `<!-- EDIT -->` comment in `index.html`:

- **Name, tagline, bio** — hero + about sections
- **Work** — duplicate a `<li class="proj-item">` per project; swap name, year, description, tags, and `href` (minimal text list, no cards).
- **Experience** — edit the `<li>`s in the experience list
- **Contact** — email (`mailto:`) and social links
- **Colors / fonts** — the `:root` and `[data-theme="light"]` blocks at the top of `styles.css`
  (`--accent` is the single accent color; `--font-*` are the typefaces)

## Preview locally

Any static server works. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages (free)

This site has **no build step**, so GitHub serves the files directly.

1. Initialize and commit:

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
```

2. Create a repo on GitHub and push. Two hosting options:
   - **User site** (`https://<username>.github.io`): name the repo exactly `<username>.github.io`.
   - **Project site** (`https://<username>.github.io/<repo>`): name the repo anything.

```bash
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**,
   choose branch `main` and folder `/ (root)`, then **Save**.

4. Wait ~1 minute; your site goes live at the URL above.

> Note: if you deploy as a **project site**, asset paths already use relative URLs
> (`assets/...`), so they resolve correctly under the `/<repo>/` subpath — no changes needed.
