#!/bin/bash

cd /Users/jason/projects/whatagooddeal/apps/web/public/slides

counter=1

# Process all image files (JPEG and HEIC) - convert to JPEG with aggressive compression
for file in *.jpeg *.JPEG *.heic *.HEIC; do
  if [ -f "$file" ]; then
    echo "Converting $file to slide${counter}.jpg..."
    magick "$file" -resize '800x800>' -quality 75 -strip "slide${counter}.jpg"
    counter=$((counter+1))
  fi
done

echo "Converted $((counter-1)) images to optimized JPEG format"
