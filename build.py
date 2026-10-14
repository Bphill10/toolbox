#!/usr/bin/env python3
"""Stitch src/ back into the one self-contained page.

  src/index.html      the shell: header, home page, module loader
  src/modules/*.html  one file per tool (comp, offer, merit, ...)
  src/data/*          shared data the tools read (people, grades, ...)
  src/i18n.js         translations
  src/pages/*.html    standalone pages, each served at /<name> (e.g. /analysis);
                      they may use {{include:...}} too

src/index.html marks where each file goes with {{include:<path under src/>}}.
Run:  python3 build.py   -> writes dist/index.html
Edit files in src/; dist/ is regenerated on every build (and on every Vercel deploy).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "dist" / "index.html"
MARK = re.compile(r"\{\{include:([^}]+)\}\}")


def read(p):
    return p.read_bytes().decode("utf-8")  # keep line endings exactly as written


def main():
    shell = read(SRC / "index.html")
    used = set()

    def include(m):
        rel = m.group(1)
        p = SRC / rel
        if not p.is_file():
            sys.exit(f"build failed: src/index.html includes {rel}, which does not exist")
        used.add(p.resolve())
        return read(p)

    out = MARK.sub(include, shell)

    # A module file nobody includes is almost always a forgotten marker.
    for p in sorted((SRC / "modules").glob("*.html")):
        if p.resolve() not in used:
            sys.exit(f"build failed: {p.relative_to(ROOT)} is not included anywhere in src/index.html")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_bytes(out.encode("utf-8"))

    # Standalone pages: src/pages/<name>.html is served at /<name>.
    for p in sorted((SRC / "pages").glob("*.html")):
        dest = OUT.parent / p.stem / "index.html"
        dest.parent.mkdir(exist_ok=True)
        dest.write_bytes(MARK.sub(include, read(p)).encode("utf-8"))
        print(f"page /{p.stem}")
    print(f"built dist/index.html: {len(used)} files stitched, {len(out.encode('utf-8')):,} bytes")


if __name__ == "__main__":
    main()
