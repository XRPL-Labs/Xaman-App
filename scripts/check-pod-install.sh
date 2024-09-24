#!/bin/bash
set -e


LIBS_REQUIRING_POD_INSTALL=(
    "@react-native-community/netinfo"
    "@react-native-firebase/analytics"
    "@react-native-firebase/app"
    "@react-native-firebase/crashlytics"
    "@react-native-firebase/messaging"
    "@veriff/react-native-sdk"
    "react-native"
    "react-native-camera"
    "react-native-interactable"
    "react-native-navigation"
    "realm"
    "tangem-sdk-react-native"
)

cp package.json package.json.current
git show HEAD~1:package.json > package.json.previous

NEEDS_POD_INSTALL=0
for LIB in "${LIBS_REQUIRING_POD_INSTALL[@]}"; do
    CURRENT_VERSION=$(jq -r --arg LIB "$LIB" '.dependencies[$LIB] // .devDependencies[$LIB]' package.json.current)
    PREVIOUS_VERSION=$(jq -r --arg LIB "$LIB" '.dependencies[$LIB] // .devDependencies[$LIB]' package.json.previous)
    if [ "$CURRENT_VERSION" != "$PREVIOUS_VERSION" ]; then
        NEEDS_POD_INSTALL=1
    fi
done

# Clean up the temporary files
rm package.json.current package.json.previous

exit $NEEDS_POD_INSTALL
