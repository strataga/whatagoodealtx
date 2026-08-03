#!/bin/bash
set -eu

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir"

counter=1

# Process all image files (JPEG and HEIC) - convert to JPEG with aggressive compression
for file in *.jpeg *.JPEG *.heic *.HEIC; do
  [ -f "$file" ] || continue
  echo "Converting $file to slide${counter}.jpg..."
  magick "$file" -resize '800x800>' -quality 75 -strip "slide${counter}.jpg"
  counter=$((counter+1))
done

echo "Converted $((counter-1)) images to optimized JPEG format"
