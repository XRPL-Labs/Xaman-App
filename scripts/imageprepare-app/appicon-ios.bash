#!/bin/bash
for png in *.png; do

    sips -z 40 40 $png --out "40_$png"
    sips -z 60 60 $png --out "60_$png"
    sips -z 58 58 $png --out "58_$png"
    sips -z 76 76 $png --out "76_$png"
    sips -z 80 80 $png --out "80_$png"
    sips -z 87 87 $png --out "87_$png"
    sips -z 114 114 $png --out "114_$png"
    sips -z 120 120 $png --out "120_$png"
    sips -z 128 128 $png --out "128_$png"
    sips -z 136 136 $png --out "136_$png"
    sips -z 152 152 $png --out "152_$png"
    sips -z 167 167 $png --out "167_$png"
    sips -z 180 180 $png --out "180_$png"
    sips -z 192 192 $png --out "192_$png"

done