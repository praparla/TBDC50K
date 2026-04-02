#!/usr/bin/env python3
"""Build script — bundles JS files and minifies CSS.

Usage:
    python3 build.py          # build all
    python3 build.py --clean  # remove build artifacts

Produces:
    dist/bundle.min.js   — concatenated + minified core JS
    dist/style.min.css   — minified CSS
    dist/gpx_data.min.js — minified GPX data

No dependencies beyond Python 3.9+ stdlib.
"""

import os
import re
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"

# Core JS files in load order (matches <script defer> order in index.html)
CORE_JS = [
    "events.js",
    "stops.js",
    "pins.js",
    "pace.js",
    "race.js",
    "tools.js",
    "app.js",
    "elevation.js",
]

# Separate files (data or lazy-loaded — not bundled)
SEPARATE_JS = {
    "gpx_data.js": "gpx_data.min.js",
}

CSS_FILE = "style.css"
CSS_OUT = "style.min.css"
BUNDLE_OUT = "bundle.min.js"


def minify_js(code: str) -> str:
    """Basic JS minification: strip comments, collapse whitespace."""
    # Remove single-line comments (but not URLs like https://)
    code = re.sub(r'(?<![:\'"\\])//(?!/)[^\n]*', '', code)
    # Remove multi-line comments
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    # Collapse runs of whitespace (but preserve newlines to avoid breaking ASI)
    code = re.sub(r'[ \t]+', ' ', code)
    # Remove blank lines
    code = re.sub(r'\n\s*\n+', '\n', code)
    # Trim leading whitespace per line
    code = re.sub(r'\n +', '\n', code)
    # Trim trailing whitespace per line
    code = re.sub(r' +\n', '\n', code)
    return code.strip() + '\n'


def minify_css(code: str) -> str:
    """CSS minification: strip comments and unnecessary whitespace."""
    # Remove comments
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    # Remove newlines and collapse whitespace
    code = re.sub(r'\s+', ' ', code)
    # Remove spaces around selectors and braces
    code = re.sub(r'\s*([{}:;,>~+])\s*', r'\1', code)
    # Remove trailing semicolons before closing braces
    code = re.sub(r';}', '}', code)
    # Remove leading space
    code = code.strip()
    return code + '\n'


def build():
    DIST.mkdir(exist_ok=True)

    # ── Bundle core JS ──
    parts = []
    total_raw = 0
    for name in CORE_JS:
        src = ROOT / name
        content = src.read_text()
        total_raw += len(content)
        parts.append(f"/* === {name} === */\n{content}")

    bundle_raw = "\n".join(parts)
    bundle_min = minify_js(bundle_raw)
    (DIST / BUNDLE_OUT).write_text(bundle_min)
    print(f"  {BUNDLE_OUT}: {total_raw:,} → {len(bundle_min):,} bytes "
          f"({100 - len(bundle_min)*100//total_raw}% smaller, {len(CORE_JS)} files → 1)")

    # ── Minify separate JS files ──
    for src_name, out_name in SEPARATE_JS.items():
        src = ROOT / src_name
        raw = src.read_text()
        mini = minify_js(raw)
        (DIST / out_name).write_text(mini)
        print(f"  {out_name}: {len(raw):,} → {len(mini):,} bytes "
              f"({100 - len(mini)*100//len(raw)}% smaller)")

    # ── Minify CSS ──
    css_raw = (ROOT / CSS_FILE).read_text()
    css_min = minify_css(css_raw)
    (DIST / CSS_OUT).write_text(css_min)
    print(f"  {CSS_OUT}: {len(css_raw):,} → {len(css_min):,} bytes "
          f"({100 - len(css_min)*100//len(css_raw)}% smaller)")

    # ── Copy unchanged files that index-prod needs ──
    for name in ["config.js", "backend-loader.js"]:
        shutil.copy2(ROOT / name, DIST / name)

    print("\n✓ Build complete → dist/")


def clean():
    if DIST.exists():
        shutil.rmtree(DIST)
        print("✓ dist/ removed")
    else:
        print("Nothing to clean")


if __name__ == "__main__":
    if "--clean" in sys.argv:
        clean()
    else:
        build()
