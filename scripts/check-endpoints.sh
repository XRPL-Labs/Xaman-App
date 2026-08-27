#!/usr/bin/env bash

# Guard: src/common/constants/endpoints.ts must carry the production values.
# Used by the pre-commit hook and the endpoints-guard GitHub workflow.

FILE="src/common/constants/endpoints.ts"
HOSTNAME_LINE="export const HOSTNAME = 'xaman.app';"
APIURL_LINE='export const ApiUrl = `https://${HOSTNAME}/api`;'

fail() {
    echo "ERROR: $1"
    echo "Production values required in $FILE:"
    echo "  $HOSTNAME_LINE"
    echo "  $APIURL_LINE"
    exit 1
}

[ -f "$FILE" ] || fail "$FILE not found"

# active (non //-commented) lines only
active() {
    grep -vE '^[[:space:]]*//' "$FILE"
}

# the exact production lines must be present as active code
[ "$(active | grep -cxF "$HOSTNAME_LINE")" -eq 1 ] || fail "HOSTNAME does not have its production value"
[ "$(active | grep -cxF "$APIURL_LINE")" -eq 1 ] || fail "ApiUrl does not have its production value"

# and nothing else may assign to HOSTNAME or ApiUrl (catches later overrides)
[ "$(active | grep -cE '(^|[^A-Za-z0-9_])HOSTNAME[[:space:]]*=')" -eq 1 ] || fail "extra assignment to HOSTNAME detected"
[ "$(active | grep -cE '(^|[^A-Za-z0-9_])ApiUrl[[:space:]]*=')" -eq 1 ] || fail "extra assignment to ApiUrl detected"

echo "[✓] endpoints.ts carries production values"
