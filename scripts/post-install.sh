#!/usr/bin/env bash

CYAN='\033[1;36m'
RED='\033[1;31m'
GREEN='\033[1;32m'
NC='\033[0m' # No Color

function _git_hook() {
    echo -e "${GREEN}[-] Installing git hooks... ${NC}"

    GIT_DIR=$(git rev-parse --git-dir)

    # remove if any exist pre-commit hook
    rm -f $GIT_DIR/hooks/pre-commit 2> /dev/null

    # this command creates symlink to our pre-commit script
    ln -s ../../scripts/pre-commit.sh $GIT_DIR/hooks/pre-commit

    # execute permission
    chmod +x $GIT_DIR/hooks/pre-commit
}

function _patch(){
    echo -e "${GREEN}[-] Patching packages... ${NC}"
    # # patch packages
    npx patch-package
}



function _check_pod_install() {
    # checking for pod install requirement
    scripts/check-pod-install.sh
    podInstallExitCode=$?
    if [[ "$podInstallExitCode" -ne 0 ]]; then
        echo -e ""
        echo -e "${RED}[!] Warning: don't forget to run 'pod install' in '/ios' directory (｡◕‿‿◕｡) ${NC}"
    fi
}



#  Main ==================================================================== */
echo -e "${CYAN}[*] Post Install.. ${NC}"

_git_hook
_patch
_check_pod_install

echo -e "\n${GREEN}[*] Everything went well! ${NC}"

