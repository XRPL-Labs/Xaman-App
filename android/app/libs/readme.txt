# RN 0.74.2 AARs — 16KB ELF (do not use NDK 28 for ReactAndroid: Folly
# fails with char_traits<unsigned char>. Use NDK 26 + linker max-page-size.)
#
# From a shallow clone of facebook/react-native @ v0.74.2:
#   - pin ndkVersion = 26.1.10909125 (default)
#   - add CMake -DCMAKE_SHARED_LINKER_FLAGS=-Wl,-z,max-page-size=16384
#     to ReactAndroid and hermes-engine
#   - overlay PATCHED_WebSocketModule.java (IPv4 DNS)
#   ./gradlew :packages:react-native:ReactAndroid:hermes-engine:assembleDebug assembleRelease
#   ./gradlew :packages:react-native:ReactAndroid:assembleDebug assembleRelease
# Copy into android/app/libs/ (gitignored):
#   ReactAndroid-debug.aar / ReactAndroid-release.aar
#   hermes-engine-debug.aar / hermes-engine-release.aar
#   fbjni-0.7.0.aar  (Maven com.facebook.fbjni:fbjni:0.7.0 — first 16KB libfbjni.so;
#                     merge hook overwrites the 4KB copy still inside ReactAndroid)
# Do NOT touch CryptoModule / Vault / global.ts (native entropy override).

git clone https://github.com/facebook/react-native.git
cd ~/Desktop/Xaman/react-native

git checkout v0.74.2                              
yarn install

# Disable Hermes in the React Native build
echo "hermesEnabled=true" >> packages/react-native/ReactAndroid/gradle.properties

./gradlew :packages:react-native:ReactAndroid:build
mkdir ~/Desktop/Xaman/xaman-app/android/app/libs
cp packages/react-native/ReactAndroid/build/outputs/aar/* ~/Desktop/Xaman/xaman-app/android/app/libs

./gradlew clean

# First, build the Hermes engine
./gradlew :packages:react-native:ReactAndroid:hermes-engine:build

# Build Hermes engine specifically
./gradlew :packages:react-native:ReactAndroid:hermes-engine:assembleDebug
./gradlew :packages:react-native:ReactAndroid:hermes-engine:assembleRelease


# Clean and rebuild with Hermes
# ./gradlew :packages:react-native:ReactAndroid:clean
# Not this one, fucked hermes ./gradlew :packages:react-native:ReactAndroid:build
./gradlew :packages:react-native:ReactAndroid:assembleDebug
./gradlew :packages:react-native:ReactAndroid:assembleRelease

# Copy the new AARs (these should now include Hermes)
cp packages/react-native/ReactAndroid/build/outputs/aar/* ~/Desktop/Xaman/xaman-app/android/app/libs/

# Xaman/Android
cd ~/Desktop/Xaman/xaman-app/android
./gradlew clean assembleDebug
./gradlew clean assembleRelease

./gradlew clean assembleDebug assembleRelease

#npx react-native run-android --mode=Debug  
#npx react-native run-android --mode=Production

# adb logcat -c
# adb logcat | grep -E "(FATAL|AndroidRuntime|ReactNativeJS|DEBUG|ERROR)"|grep -v ExynosCamera
adb logcat -c; adb logcat | grep -E "(FATAL|AndroidRuntime|ReactNativeJS|DEBUG|ERROR|IPv4Pref)"|grep -v ExynosCamera


npx react-native run-android --mode=Debug
npx react-native run-android --mode=Release

--- debug more

adb shell ps | grep "com.xrpllabs.xumm"
find pid
adb logcat | grep 23329
