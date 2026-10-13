#!/usr/bin/env python3
"""Stitch src/ back into one self-contained index.html.

  src/index.html      shell; holds the markers below
  src/modules/*.html  one file per tool, inlined at <!-- @modules --> (A-Z order)
  src/data/*.json     inlined at <!-- @data --> as window.DATA.<filename>
  src/i18n.js         inlined at <!-- @i18n -->

Run:  python3 build.py      -> writes index.html
Edit files in src/, never index.html — it is overwritten on every build.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"


def main():
    shell = (SRC / "index.html").read_text(encoding="utf-8")

    modules = "\n".join(
        f"<!-- {p.name} -->\n" + p.read_text(encoding="utf-8").strip()
        for p in sorted((SRC / "modules").glob("*.html"))
    )

    data = {}
    for p in sorted((SRC / "data").glob("*.json")):
        try:
            data[p.stem] = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            sys.exit(f"build failed: {p.relative_to(ROOT)} is not valid JSON ({e})")
    # Data must load before modules run their scripts, so it goes in <head>.
    data_js = "<script>window.DATA = " + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + ";</script>"

    i18n = "<script>\n" + (SRC / "i18n.js").read_text(encoding="utf-8").strip() + "\n</script>"

    for marker in ("<!-- @modules -->", "<!-- @data -->", "<!-- @i18n -->"):
        if shell.count(marker) != 1:
            sys.exit(f"build failed: src/index.html must contain {marker} exactly once")

    shell = shell.replace("<!-- @data -->", "")
    shell = shell.replace("</head>", data_js + "\n</head>", 1)
    out = (shell.replace("<!-- @modules -->", modules)
                .replace("<!-- @i18n -->", i18n))

    OUT.write_text(out, encoding="utf-8")
    n = len(list((SRC / "modules").glob("*.html")))
    print(f"built index.html — {n} module(s), {len(data)} data file(s), {len(out):,} bytes")


if __name__ == "__main__":
    main()
