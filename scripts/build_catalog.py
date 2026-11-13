#!/usr/bin/env python3
"""Build the photography collection: 3840 px masters, previews, catalog and index pages.

Re-runnable. Sources are read-only; outputs go under this repository.
Usage: python scripts/build_catalog.py --wallpapers PATH --shoot DIR[:CATS_FILE] ...
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MASTER = 3840
PREVIEW = 1200
AUTHOR = "Yuval Kolodkin-Gal"

CAMERA_NAMES = {
    "canon-eos-r50": "Canon EOS R50",
    "canon-powershot-sx270-hs": "Canon PowerShot SX270 HS",
    "phone": "Phone camera",
    "unknown": "Unknown camera",
}


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def tier(w: int, h: int) -> str:
    mp = w * h / 1e6
    if mp >= 20:
        return "full-res-20mp-plus"
    if mp >= 10:
        return "12mp-class"
    if mp >= 4:
        return "medium-4-10mp"
    return "web-under-4mp"


def save_master(src: Image.Image, dst: Path) -> tuple[int, int]:
    im = src.convert("RGB")
    if max(im.size) > MASTER:
        im.thumbnail((MASTER, MASTER), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, quality=92, optimize=True, progressive=True)
    pv = im.copy()
    pv.thumbnail((PREVIEW, PREVIEW), Image.LANCZOS)
    pdst = ROOT / "previews" / (dst.stem + ".jpg")
    pdst.parent.mkdir(parents=True, exist_ok=True)
    pv.save(pdst, quality=82, optimize=True, progressive=True)
    return im.size


# Camera confirmed by the photographer, overriding filename inference.
CAMERA_OVERRIDES = {
    "stone-and-branches": "canon-powershot-sx270-hs",
    "golden-lichen": "canon-powershot-sx270-hs",
    "sand-and-sky": "canon-powershot-sx270-hs",
    "seedpod-still-life": "canon-powershot-sx270-hs",
    "lavender-light": "canon-powershot-sx270-hs",
    "jellyfish-drift": "phone",
    "night-shore": "phone",
    "summer-spirals": "phone",
    "moray-in-shelter": "phone",
    "ember-clouds-city-silhouette": "phone",
}


# Wallpapers photos left out of this collection.
EXCLUDE = {"bottlebrush", "ember-clouds-city-silhouette", "moray-in-shelter", "stone-and-branches", "city-afterglow", "featherlines"}

# Subject for each Wallpapers photo (the source collection only records a colour theme).
SUBJECTS = {
    "butterfly-in-gold": "insects", "summer-spirals": "insects",
    "fig-thief": "birds", "hoopoe-in-the-grass": "birds", "quiet-water": "birds",
    "featherlines": "birds", "reed-reflections": "ducks",
    "porcelain-petals": "flowers-plants", "canopy-light": "flowers-plants",
    "violet-water": "flowers-plants", "magenta-in-the-leaves": "flowers-plants",
    "bottlebrush": "flowers-plants", "pink-berry": "flowers-plants", "lavender-light": "flowers-plants",
    "garden-nap": "cats",
    "a-place-to-pause": "landscape", "sand-and-sky": "landscape", "open-sky": "sky",
    "last-amber": "sunset", "city-afterglow": "sunset", "ember-clouds-city-silhouette": "sunset", "rose-city": "sunset",
    "stone-and-branches": "city", "night-shore": "night",
    "jellyfish-drift": "sea-life", "moray-in-shelter": "sea-life",
    "golden-lichen": "nature-details", "seedpod-still-life": "nature-details",
}


def infer_wallpaper(src_file: str, w: int, h: int):
    name = Path(src_file).name
    m = re.match(r"IMG-(\d{8})-WA\d+", name)
    if m:
        return "unknown", datetime.strptime(m.group(1), "%Y%m%d").date().isoformat(), "inferred: WhatsApp copy, camera unknown"
    m = re.match(r"IMG_(\d{8})_\d+", name)
    if m:
        return "phone", datetime.strptime(m.group(1), "%Y%m%d").date().isoformat(), "inferred: phone camera filename"
    if re.match(r"IMG_\d{4}\.JPG$", name, re.I) and {w, h} & {4000, 3000, 2248, 2992}:
        return "canon-powershot-sx270-hs", "unknown", "inferred: Canon filename + 12 MP 4000x3000 sensor sizes"
    return "unknown", "unknown", "unknown source"


def wallpaper_items(repo: Path):
    coll = json.loads((repo / "metadata/collection.json").read_text())
    for w in coll["wallpapers"]:
        if w["slug"] in EXCLUDE:
            continue
        s = w["source"]
        cam, date, how = infer_wallpaper(s.get("file", ""), s.get("width", 0), s.get("height", 0))
        if w["slug"] in CAMERA_OVERRIDES:
            cam, how = CAMERA_OVERRIDES[w["slug"]], "confirmed by photographer"
        yield {
            "slug": w["slug"], "title": w["title"], "description": w.get("description", ""),
            "category": SUBJECTS.get(w["slug"], "uncategorized"), "theme": w.get("theme"), "src": repo / w["master"],
            "camera": cam, "camera_source": how, "date": date,
            "original_size": [s.get("width"), s.get("height")],
            "collection": "wallpapers", "exif": {},
        }


def exif_of(jpg: Path) -> dict:
    try:
        e = Image.open(jpg).getexif()
        ex = e.get_ifd(0x8769)
    except Exception:
        return {}
    out = {"model": e.get(272), "lens": ex.get(0xA434), "iso": ex.get(0x8827),
           "f_number": float(ex[0x829D]) if 0x829D in ex else None,
           "exposure": str(ex.get(0x829A)) if 0x829A in ex else None,
           "focal_mm": float(ex[0x920A]) if 0x920A in ex else None,
           "datetime": ex.get(0x9003) or e.get(306)}
    return {k: v for k, v in out.items() if v not in (None, "")}


def shoot_items(final_dir: Path, originals: Path, shoot: str):
    for jpg in sorted(final_dir.glob("*/*.jpg")):
        if jpg.name.endswith(".w3.jpg") or "your-crop" in jpg.name:
            continue
        cat, stem = jpg.parent.name, jpg.stem
        if stem in {"IMG_0623", "IMG_0624", "IMG_0625", "IMG_0632", "IMG_0635", "IMG_0636"}:
            cat = "sunset"
        ex = exif_of(originals / f"{stem}.JPG")
        model = (ex.get("model") or "").lower()
        cam = "canon-eos-r50" if "r50" in model else ("unknown" if not model else re.sub(r"[^a-z0-9]+", "-", model).strip("-"))
        dt = ex.get("datetime")
        date = datetime.strptime(dt, "%Y:%m:%d %H:%M:%S").date().isoformat() if dt else "unknown"
        yield {
            "slug": f"{shoot}_{cat}_{stem.split('_')[-1]}", "title": f"{cat.replace('-', ' ').title()} {stem.split('_')[-1]}",
            "description": "", "category": cat, "src": jpg, "camera": cam,
            "camera_source": "exif" if model else "unknown", "date": date,
            "original_size": None, "collection": shoot, "exif": ex,
        }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wallpapers", type=Path)
    ap.add_argument("--shoot", action="append", default=[],
                    help="NAME=FINAL_DIR=ORIGINALS_DIR (rendered exports by category, camera JPEGs for EXIF)")
    a = ap.parse_args()

    items = []
    if a.wallpapers:
        items += list(wallpaper_items(a.wallpapers))
    for spec in a.shoot:
        name, final, orig = spec.split("=")
        items += list(shoot_items(Path(final), Path(orig), name))

    catalog_path = ROOT / "metadata/catalog.json"
    old = {p["slug"]: p for p in json.loads(catalog_path.read_text())["photos"]} if catalog_path.exists() else {}
    photos = []
    for it in items:
        year = it["date"][:4] if it["date"] != "unknown" else "date-unknown"
        rel = Path("photos") / it["camera"] / year / f"{it['slug']}.jpg"
        dst = ROOT / rel
        src_hash = sha256(it["src"])
        prev = old.get(it["slug"])
        if prev and prev.get("source_sha256") == src_hash and dst.exists():
            w, h = prev["width"], prev["height"]
        else:
            with Image.open(it["src"]) as im:
                im = ImageOps.exif_transpose(im)
                if it["original_size"] is None:
                    it["original_size"] = list(im.size)
                w, h = save_master(im, dst)
        osz = it["original_size"] or (prev or {}).get("original_size") or [w, h]
        photos.append({
            "slug": it["slug"], "title": it["title"], "description": it["description"],
            "category": it["category"], "wallpaper_theme": it.get("theme"), "collection": it["collection"],
            "camera": it["camera"], "camera_name": CAMERA_NAMES.get(it["camera"], it["camera"]),
            "camera_source": it["camera_source"], "date": it["date"],
            "original_size": osz, "original_megapixels": round(osz[0] * osz[1] / 1e6, 1),
            "resolution_tier": tier(*osz), "width": w, "height": h,
            "orientation": "portrait" if h > w else ("square" if h == w else "landscape"),
            "exif": it["exif"], "master": rel.as_posix(), "preview": f"previews/{it['slug']}.jpg",
            "source_sha256": src_hash, "photographer": AUTHOR,
        })
    photos.sort(key=lambda p: (p["date"], p["slug"]))
    keep = {p["master"] for p in photos} | {p["preview"] for p in photos}
    for f in list((ROOT / "photos").rglob("*.jpg")) + list((ROOT / "previews").glob("*.jpg")):
        if f.relative_to(ROOT).as_posix() not in keep:
            f.unlink()
    for d in sorted((ROOT / "photos").rglob("*"), reverse=True):
        if d.is_dir() and not any(d.iterdir()):
            d.rmdir()
    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    catalog_path.write_text(json.dumps({"author": AUTHOR, "count": len(photos), "photos": photos}, indent=2, default=str) + "\n")
    (ROOT / "data.js").write_text("const CATALOG=" + json.dumps(photos, default=str) + ";\n")
    write_indexes(photos)
    print(f"{len(photos)} photos")


def write_indexes(photos):
    groups = {
        "by-camera": lambda p: p["camera_name"],
        "by-category": lambda p: p["category"],
        "by-resolution": lambda p: p["resolution_tier"],
        "by-year": lambda p: p["date"][:4] if p["date"] != "unknown" else "date unknown",
    }
    for folder, key in groups.items():
        d = ROOT / folder
        d.mkdir(exist_ok=True)
        for old in d.glob("*.md"):
            old.unlink()
        g = defaultdict(list)
        for p in photos:
            g[key(p)].append(p)
        lines = [f"# Photos {folder.replace('-', ' ')}\n"]
        for k in sorted(g):
            fn = re.sub(r"[^a-z0-9]+", "-", str(k).lower()).strip("-") + ".md"
            lines.append(f"- [{k}]({fn}) ({len(g[k])})")
            body = [f"# {k}\n", f"{len(g[k])} photos by {AUTHOR}.\n"]
            for p in g[k]:
                body.append(f"### {p['title']}\n\n[![{p['title']}](../{p['preview']})](../{p['master']})\n\n"
                            f"{p['camera_name']} · {p['date']} · {p['category']} · original {p['original_megapixels']} MP\n")
            (d / fn).write_text("\n".join(body))
        (d / "README.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
