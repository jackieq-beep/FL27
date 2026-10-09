#!/usr/bin/env python3
"""Builds the Football League 2026 website into the dist/ folder.

Run:  python build.py            (uses base_path from site.yaml)
      python build.py --base ""  (build for a custom domain / local preview at /)
"""
import argparse
import hashlib
import json
import re
import shutil
from datetime import date
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup
from PIL import Image

from icons import ICONS

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
IMG_WIDTHS = [480, 960, 1440, 2000]


def load_yaml(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def deep_merge(base, override):
    """Missing translations fall back to English."""
    if isinstance(base, dict) and isinstance(override, dict):
        out = dict(base)
        for k, v in override.items():
            out[k] = deep_merge(base.get(k), v) if k in base else v
        return out
    return override if override not in (None, "") else base


# ---------- images ----------

def build_images():
    """Make resized WebP copies of every image so pages load fast."""
    out_dir = DIST / "img"
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = ROOT / ".cache" / "img"
    cache_dir.mkdir(parents=True, exist_ok=True)
    catalog = {}
    for src in sorted((ROOT / "static" / "img").iterdir()):
        if src.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        digest = hashlib.md5(src.read_bytes()).hexdigest()[:8]
        with Image.open(src) as im:
            im.load()
            w, h = im.size
            has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
            widths = [x for x in IMG_WIDTHS if x < w] + [min(w, IMG_WIDTHS[-1])]
            variants = []
            for tw in sorted(set(widths)):
                name = f"{src.stem}-{tw}-{digest}.webp"
                cached = cache_dir / name
                if not cached.exists():
                    th = round(h * tw / w)
                    frame = im.convert("RGBA" if has_alpha else "RGB").resize((tw, th), Image.LANCZOS)
                    frame.save(cached, "WEBP", quality=80, method=6)
                shutil.copy2(cached, out_dir / name)
                variants.append((tw, name))
        catalog[src.name] = {"w": w, "h": h, "variants": variants}
    return catalog


# ---------- content ----------

def load_news(lang):
    posts = []
    for path in sorted((ROOT / "content" / "news").glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
        meta, body = (yaml.safe_load(m.group(1)), m.group(2)) if m else ({}, raw)
        meta["slug"] = path.stem
        meta["html"] = Markup(markdown.markdown(body))
        posts.append(meta)
    posts.sort(key=lambda p: (-(p.get("date") or date.min).toordinal() if p.get("date") else 0, p.get("order", 999)))
    return posts


# ---------- build ----------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=None, help="override base_path from site.yaml")
    args = ap.parse_args()

    site = load_yaml(ROOT / "site.yaml")
    base = (site.get("base_path") or "") if args.base is None else args.base
    base = "/" + base.strip("/") if base.strip("/") else ""
    site["base"] = base
    site["social_list"] = [k for k in ("youtube", "instagram", "x", "tiktok", "discord", "facebook") if (site.get("social") or {}).get(k)]

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    images = build_images()

    # static files with cache-busting names
    assets = {}
    for kind in ("css", "js"):
        for f in (ROOT / "static" / kind).glob(f"*.{kind}"):
            digest = hashlib.md5(f.read_bytes()).hexdigest()[:8]
            dest = DIST / kind / f"{f.stem}.{digest}.{kind}"
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, dest)
            assets[f.name] = f"{base}/{kind}/{dest.name}"
    shutil.copy2(ROOT / "static" / "img" / "logo-mark.png", DIST / "img" / "logo-mark.png")
    for f in (ROOT / "public").iterdir():
        shutil.copy2(f, DIST / f.name)
    (DIST / ".nojekyll").write_text("")

    env = Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    def asset(name):
        return assets[name]

    def img(name, alt="", sizes="100vw", cls="", eager=False, style=""):
        info = images[name]
        srcset = ", ".join(f"{base}/img/{n} {w}w" for w, n in info["variants"])
        largest = info["variants"][-1][1]
        loading = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
        cls_attr = f' class="{cls}"' if cls else ""
        style_attr = f' style="{style}"' if style else ""
        return Markup(
            f'<img src="{base}/img/{largest}" srcset="{srcset}" sizes="{sizes}" '
            f'width="{info["w"]}" height="{info["h"]}" alt="{Markup.escape(alt)}" {loading}{cls_attr}{style_attr}>'
        )

    def img_url(name, width=1440):
        variants = images[name]["variants"]
        pick = next((n for w, n in variants if w >= width), variants[-1][1])
        return f"{site['site_url']}{base}/img/{pick}"

    def icon(name, cls="icon"):
        return Markup(ICONS[name].replace("<svg ", f'<svg class="{cls}" aria-hidden="true" focusable="false" ', 1))

    env.globals.update(site=site, asset=asset, img=img, img_url=img_url, icon=icon, year=date.today().year)

    english = load_yaml(ROOT / "i18n" / "en.yaml")
    languages = [l for l in site["languages"] if l.get("enabled")]
    pages = [("home", "", "pages/home.html")] + [
        (n["key"], n["path"], "pages/coming-soon.html") for n in site["nav"] if n["key"] != "home"
    ]
    sitemap = []

    for lang in languages:
        code = lang["code"]
        lang_file = ROOT / "i18n" / f"{code}.yaml"
        t = deep_merge(english, load_yaml(lang_file)) if code != "en" and lang_file.exists() else english
        prefix = "" if code == "en" else f"/{code}"

        def url(path="", _prefix=prefix):
            return f"{base}{_prefix}/{path}"

        def lang_url(target_code, path):
            return f"{base}{'' if target_code == 'en' else '/' + target_code}/{path}"

        news = load_news(code)
        for key, path, template in pages:
            out = DIST / prefix.strip("/") / path / "index.html"
            out.parent.mkdir(parents=True, exist_ok=True)
            html = env.get_template(template).render(
                t=t, lang=lang, languages=languages, all_languages=site["languages"],
                page_key=key, page_path=path, url=url, lang_url=lang_url, news=news,
                canonical=f"{site['site_url']}{url(path)}",
            )
            out.write_text(html, encoding="utf-8")
            sitemap.append(f"{site['site_url']}{url(path)}")

        if code == "en":
            html = env.get_template("pages/404.html").render(
                t=t, lang=lang, languages=languages, all_languages=site["languages"],
                page_key="404", page_path="", url=url, lang_url=lang_url, news=news,
                canonical=f"{site['site_url']}{url()}",
            )
            (DIST / "404.html").write_text(html, encoding="utf-8")

    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in sitemap)
        + "</urlset>\n",
        encoding="utf-8",
    )
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {site['site_url']}{base}/sitemap.xml\n")
    print(f"Built {len(sitemap)} pages into dist/ (base path: '{base or '/'}')")


if __name__ == "__main__":
    main()
