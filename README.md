# Photography

Original photographs by **Yuval Kolodkin-Gal**. All rights reserved — see [COPYRIGHT](COPYRIGHT).

Open [`index.html`](index.html) for a filterable gallery (camera, category, resolution, year).

## Browse

- [By camera](by-camera/README.md)
- [By category](by-category/README.md)
- [By original resolution](by-resolution/README.md)
- [By year](by-year/README.md)

## Layout

```
photos/<camera>/<year>/<slug>.jpg   3840 px masters (long edge)
previews/<slug>.jpg                 1200 px previews
metadata/catalog.json               one record per photo
```

`metadata/catalog.json` records the camera, date, category, original size and megapixels, resolution tier,
EXIF (where available) and a source checksum for each photo. When a camera or date could not be read from the
original file it is listed as `unknown`, and `camera_source` says how the camera was determined.

Resolution tiers describe the original capture: `full-res-20mp-plus`, `12mp-class`, `medium-4-10mp`,
`web-under-4mp`.

## Rebuilding

```
python scripts/build_catalog.py --wallpapers ../Wallpapers \
  --shoot 2026-11-13=/path/to/exports/final=/path/to/camera/jpegs
```
