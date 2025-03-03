#!/bin/bash

# Android density scaling factors relative to mdpi (1x)
# mdpi: 1x (baseline)
# hdpi: 1.5x
# xhdpi: 2x
# xxhdpi: 3x
# xxxhdpi: 4x

# Set the Android resource directories
ANDROID_RES_DIR="/Users/wrw/Desktop/Xaman/xaman-app/android/app/src/main/res"
MDPI_DIR="${ANDROID_RES_DIR}/drawable-mdpi"
HDPI_DIR="${ANDROID_RES_DIR}/drawable-hdpi"
XHDPI_DIR="${ANDROID_RES_DIR}/drawable-xhdpi"
XXHDPI_DIR="${ANDROID_RES_DIR}/drawable-xxhdpi"
XXXHDPI_DIR="${ANDROID_RES_DIR}/drawable-xxxhdpi"
DEFAULT_DIR="${ANDROID_RES_DIR}/drawable"

# Create directories if they don't exist
mkdir -p "$MDPI_DIR" "$HDPI_DIR" "$XHDPI_DIR" "$XXHDPI_DIR" "$XXXHDPI_DIR" "$DEFAULT_DIR"

# Process each PNG file in current directory
for png in *.png; do
    # Skip if not a file
    [ -f "$png" ] || continue
    
    # Skip if already processed files
    if [[ "$png" == *"@1x.png" ]] || [[ "$png" == *"@2x.png" ]]; then
        continue
    fi
    
    echo "Processing $png..."
    
    # Extract the base filename (remove the @3x if it exists)
    if [[ "$png" == *"@3x.png" ]]; then
        filename="${png%@3x.png}"
    else
        filename="${png%.png}"
    fi
    
    # Get original dimensions
    width=$(sips -g pixelWidth "$png" | grep -o '[0-9]*$')
    height=$(sips -g pixelHeight "$png" | grep -o '[0-9]*$')
    
    # XXHDPI is equivalent to @3x (iOS), so use original for that
    # Calculate other dimensions based on Android scaling factors
    
    # xxxhdpi = 4x (4/3 of the @3x)
    width_xxxhdpi=$((width * 4 / 3))
    height_xxxhdpi=$((height * 4 / 3))
    
    # xxhdpi = 3x (our original @3x)
    width_xxhdpi=$width
    height_xxhdpi=$height
    
    # xhdpi = 2x (2/3 of the @3x)
    width_xhdpi=$((width * 2 / 3))
    height_xhdpi=$((height * 2 / 3))
    
    # hdpi = 1.5x (1/2 of the @3x)
    width_hdpi=$((width / 2))
    height_hdpi=$((height / 2))
    
    # mdpi = 1x (1/3 of the @3x)
    width_mdpi=$((width / 3))
    height_mdpi=$((height / 3))
    
    # Create Android resource versions
    
    # xxxhdpi (4x)
    cp "$png" temp.png
    sips -z $height_xxxhdpi $width_xxxhdpi temp.png --out "${XXXHDPI_DIR}/${filename}.png"
    
    # xxhdpi (3x) - original size
    cp "$png" "${XXHDPI_DIR}/${filename}.png"
    
    # xhdpi (2x)
    cp "$png" temp.png
    sips -z $height_xhdpi $width_xhdpi temp.png --out "${XHDPI_DIR}/${filename}.png"
    
    # hdpi (1.5x)
    cp "$png" temp.png
    sips -z $height_hdpi $width_hdpi temp.png --out "${HDPI_DIR}/${filename}.png"
    
    # mdpi (1x)
    cp "$png" temp.png
    sips -z $height_mdpi $width_mdpi temp.png --out "${MDPI_DIR}/${filename}.png"
    
    # Also copy to default drawable folder (usually same as mdpi)
    cp "${MDPI_DIR}/${filename}.png" "${DEFAULT_DIR}/${filename}.png"
    
    # Clean up temp file
    rm -f temp.png
    
    echo "Completed processing $filename"
done

echo "All images have been processed and placed in the appropriate Android resource directories."