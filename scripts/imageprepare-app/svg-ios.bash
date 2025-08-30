#!/bin/bash
for svg in *.svg; do
    filename="${svg%.svg}"
    svgexport "$svg" "${filename}.png" 64:64
    svgexport "$svg" "${filename}@2x.png" 128:128
    svgexport "$svg" "${filename}@3x.png" 192:192
done
