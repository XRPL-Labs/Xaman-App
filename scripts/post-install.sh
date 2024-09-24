#!/usr/bin/env bash

# Let's exit on errors
set -e

CYAN='\033[1;36m'
RED='\033[1;31m'
GREEN='\033[1;32m'
LIGHTGRAY='\033[0;37m'
NC='\033[0m' # No Color

ROOT=$(pwd)


function _git_hook() {
    echo -e "\n${GREEN}[-] Installing hooks... ${NC}"

    GIT_DIR=$(git rev-parse --git-dir)

    # remove if any exist pre-commit hook
    rm -f $GIT_DIR/hooks/pre-commit 2> /dev/null

    # this command creates symlink to our pre-commit script
    ln -s ../../scripts/pre-commit.sh $GIT_DIR/hooks/pre-commit

    # excute permission
    chmod +x $GIT_DIR/hooks/pre-commit
}

function _patch(){
    echo -e "\n${GREEN}[-] Patching packages... ${NC}"
    # # patch packages
    npx patch-package
}


function _jetify(){
    echo -e "\n${GREEN}[-] Fixing Android X... ${NC}"

    cd $ROOT
    npx jetify
}




#  Main ==================================================================== */
echo -e "${CYAN}[*] Post Install.. ${NC}"

_git_hook
_patch
_jetify

echo -e "\n${GREEN}[*] Everythinh Done! ${NC}"

