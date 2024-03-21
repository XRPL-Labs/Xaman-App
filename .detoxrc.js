module.exports = {
    apps: {
        'ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Xaman.app',
            build: 'xcodebuild -workspace ios/Xaman.xcworkspace -scheme Xaman -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'ios.release': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Xaman.app',
            build: 'xcodebuild -workspace ios/Xaman.xcworkspace -scheme Xaman -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'android.debug': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
            build: 'cd android && ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug && cd ..',
        },
        'android.release': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-x86_64-release.apk',
            build: 'cd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && cd ..',
        },
    },
    devices: {
        'ios.simulator': {
            type: 'ios.simulator',
            device: { type: 'iPhone 15 Pro' },
        },
        'android.emulator': {
            type: 'android.apk',
            device: { avdName: 'Nexus_5X_API_28' },
        },
        'android.attached': {
            type: 'android.attached',
            device: {
                adbName: '.*',
            },
        },
    },
    configurations: {
        'ios.sim': {
            device: 'ios.simulator',
            app: 'ios.release',
        },
        'android.emu': {
            device: 'android.emulator',
            app: 'android.release',
        },
        'android.attached': {
            device: 'android.attached',
            app: 'android.release',
        },
    },
};
