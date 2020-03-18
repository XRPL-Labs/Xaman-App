#!/usr/bin/env bash

# Let's exit on errors
set -e

ROOT=$(pwd)

# clean react native stuff
rm -rf $TMPDIR/react-*	
rm -rf $TMPDIR/metro-*	
watchman watch-del-all || true

# remove node_modules
rm -rf node_modules
npm cache verify	

# clean up ios
cd ios
rm -rf Pods
rm -rf build	
(killall Xcode || true)
xcrun -k 
xcodebuild -alltargets clean
pod cache clean --all
pod deintegrate

cd ..
rm -rf "$(getconf DARWIN_USER_CACHE_DIR)/org.llvm.clang/ModuleCache"
rm -rf "$(getconf DARWIN_USER_CACHE_DIR)/org.llvm.clang.$(whoami)/ModuleCache"
rm -fr ~/Library/Developer/Xcode/DerivedData/
rm -fr ~/Library/Caches/com.apple.dt.Xcode/
rm -rf ~/Library/Caches/CocoaPods

# install/update packages
cd $ROOT
brew update && brew upgrade	

# install everything 
yarn install && cd ios && pod setup && pod update && pod install
