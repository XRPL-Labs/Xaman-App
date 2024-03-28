#!/usr/bin/env bash

set -e

CURRENT_DIR=$(pwd)

# Android
# get the current version code value from android/app/build.gradle
android_gradle_file="${CURRENT_DIR}"/android/app/build.gradle
ios_project_path="${CURRENT_DIR}"/ios

regex="canonicalVersionCode = ([0-9]+)"
[[ $(cat "$android_gradle_file") =~ $regex ]]
android_version_code=${BASH_REMATCH[1]}

# iOS
iOS_build_number=$(xcodebuild -project "$ios_project_path"/Xaman.xcodeproj -scheme Xaman clean -showBuildSettings | grep CURRENT_PROJECT_VERSION | tr -d 'CURRENT_PROJECT_VERSION = ')

# increase build number and version code and apply changes
(( android_version_code++ )) || true
(( iOS_build_number++ )) || true

# xcode
cd $ios_project_path
/usr/bin/xcrun agvtool new-version -all "$iOS_build_number"

cd $CURRENT_DIR

# gradle
sed -i "" "s/canonicalVersionCode = [0-9]*/canonicalVersionCode = $android_version_code/" "$android_gradle_file"

echo "Updated canonicalVersionCode in "$android_gradle_file" to $android_version_code"
echo



