module.exports = {
    apps: {
        'ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/XUMM.app',
            build: 'xcodebuild -workspace ios/XUMM.xcworkspace -scheme XUMM -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'ios.release': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/XUMM.app',
            build: 'xcodebuild -workspace ios/XUMM.xcworkspace -scheme XUMM -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'android.debug': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
            build: 'cd android && ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug && cd ..',
        },
        'android.release': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
            build: 'cd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && cd ..',
        },
    },
    devices: {
        'ios.simulator': {
            type: 'ios.simulator',
            device: { type: 'iPhone 14 Pro Max' },
        },
        'android.emulator': {
            type: 'android.apk',
            device: { avdName: 'Nexus_5X_API_28' },
        },
    },
    configurations: {
        'ios.sim.debug': {
            device: 'ios.simulator',
            app: 'ios.debug',
        },
        'android.emu.debug': {
            device: 'android.emulator',
            app: 'android.debug',
        },
    },
};
