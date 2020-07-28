#!/usr/bin/env bash
files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '.js$|.ts$|.tsx$')

if [ -z "files" ]; then
    exit 0
fi

if [ -n "$files" ]; then
    echo "Checking lint for:"
    for f in $files; do
        echo "$f"
        e=$(node_modules/.bin/eslint --quiet --fix $f)
        if [[ -n "$e" ]]; then
            echo "ERROR: Check eslint hints."
            echo "$e"
            exit 1 # reject
        fi
    done

    echo "Checking for TSC"
    tsc=$(node_modules/.bin/tsc --noEmit)
    if [[ -n "$tsc" ]]; then
        echo "ERROR: Check TSC hints."
        echo "$tsc"
        exit 1 # reject
    fi
fi