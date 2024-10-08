#!/usr/bin/env bash

files=$(git diff --cached --name-only --diff-filter=ACM | grep -E  '\.(js|ts|tsx)$')
if [ -n "$files" ]; then
    # check for any linting errors
    lintError=$(node_modules/.bin/eslint --quiet $files)
    if [[ -n "$lintError" ]]; then
        echo "ERROR: Check eslint hints."
        echo "$lintError"
        exit 1
    fi

    # check tsc for only relevant files
    typeScriptFiles=$(echo $files | tr ' ' '\n' | grep -E '\.(ts|tsx)$')
    if [[ -z "$typeScriptFiles" ]]; then
        echo "No TypeScript files changed. Skipping TSC check."
    else
        tscError=$(node_modules/.bin/tsc --noEmit)
        if [[ -n "$tscError" ]]; then
            echo "ERROR: Check TSC hints."
            echo "$tscError"
            exit 1
        fi
    fi
fi

# checking for any translations mismatch
translationsError=$(node scripts/locales.js --check 2>&1)
if [[ -n "$translationsError" ]]; then
    echo "ERROR: Check translation files hints."
    echo "$translationsError"
    exit 1
fi
