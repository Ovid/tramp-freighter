#!/usr/bin/env bash
# Regenerate shipped portrait WebPs from the source PNGs in images/.
# Re-run only when art is added or replaced; both trees are committed so
# builds and CI never need cwebp. Requires: brew install webp
set -euo pipefail

src=images
out=public/portraits
size=384
quality=80

for png in "$src"/*/*.png; do
  rel=${png#"$src"/}
  dest="$out/${rel%.png}.webp"
  mkdir -p "$(dirname "$dest")"
  cwebp -quiet -q "$quality" -resize "$size" "$size" "$png" -o "$dest"
done
