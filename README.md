# Football League 2026 – website

The official website for Football League 2026. It is built with a small Python script and published to GitHub Pages automatically whenever `main` changes.

## Where things live

| What | Where |
| --- | --- |
| Store links, social links, shop URL, trailer, languages, menu | `site.yaml` |
| All English text on the site | `i18n/en.yaml` (other languages: `i18n/<code>.yaml`) |
| News posts | `content/news/*.md` (one file per post) |
| Images | `static/img/` (resized and converted to WebP automatically) |
| Page layouts | `templates/` |
| Styles and scripts | `static/css/main.css`, `static/js/main.js` |

## Add a news post

Create a new file in `content/news/`, for example `summer-cup.md`:

```markdown
---
title: Summer Cup is live
section: events    # announcements, updates, events or licenses
image: live-event.webp   # a file in static/img/
summary: One or two sentences shown on the card.
date: 2026-10-15     # newest dates show first
---

The full post text goes here.
```

Commit it to `main` and the site updates in a minute or two. The post gets its own page at `/news/summer-cup/`
and appears under its section tab on the News page.

## Preview locally

```bash
pip install -r requirements.txt
python build.py --base ""
python -m http.server 8000 -d dist
```

Then open http://localhost:8000.

## Google Analytics

Put your GA4 Measurement ID (looks like `G-XXXXXXXXXX`) in `site.yaml` under `ga_measurement_id`.
Analytics only runs for visitors who accept analytics cookies (Google Consent Mode v2).

## Legal pages

Privacy Policy, Terms of Service and Cookie Policy are in `content/legal/*.md`.
They are a starting point — have them reviewed for your company and the countries you sell in.
