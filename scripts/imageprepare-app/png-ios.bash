#!/bin/bash
for png in *.png; do
    # Skip if already a @1x or @2x file
    if [[ "$png" == *"@1x.png" ]] || [[ "$png" == *"@2x.png" ]]; then
        continue
    fi
    
    # Assume the input file is the @3x version
    # Extract the base filename (remove the @3x if it exists)
    if [[ "$png" == *"@3x.png" ]]; then
        filename="${png%@3x.png}"
    else
        filename="${png%.png}"
    fi
    
    # Get original dimensions
    width=$(sips -g pixelWidth "$png" | grep -o '[0-9]*$')
    height=$(sips -g pixelHeight "$png" | grep -o '[0-9]*$')
    
    # Calculate @1x and @2x dimensions
    width_1x=$((width / 3))
    height_1x=$((height / 3))
    width_2x=$((width * 2 / 3))
    height_2x=$((height * 2 / 3))
    
    # Create the @1x and @2x versions
    cp "$png" "${filename}.png"
    sips -z $height_1x $width_1x "${filename}.png" --out "${filename}@1x.png"
    
    cp "$png" "${filename}@2x.png"
    sips -z $height_2x $width_2x "${filename}@2x.png" --out "${filename}@2x.png"
    
    # Optionally rename the original to ensure it has @3x suffix
    if [[ "$png" != *"@3x.png" ]]; then
        mv "$png" "${filename}@3x.png"
    fi
done