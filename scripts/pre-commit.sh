#!/usr/bin/env bash

echo "Running pre-commit hook"  


# TESTS
cd "${0%/*}/.."

# let's fake failing test for now 
echo "Running tests"  
echo "............................"  

npm run test


# $? stores exit value of the last command
if [ $? -ne 0 ]; then  
  echo "Tests must pass before commit!"
  exit 1
fi