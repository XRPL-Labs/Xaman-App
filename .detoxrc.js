module.exports = {
    apps: {
        'xaman.ios': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Xaman.app',
            build: 'xcodebuild -workspace ios/Xaman.xcworkspace -scheme Xaman -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'xaman.android': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-x86_64-release.apk',
            build: 'cd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && cd ..',
        },
    },
    devices: {
        'ios.simulator': {
            type: 'ios.simulator',
            headless: process.env.CI ? true : undefined,
            device: { type: 'iPhone 16 Pro' },
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
        'ios.simulator+xaman.ios': {
            device: 'ios.simulator',
            app: 'xaman.ios',
        },
        'android.emulator+xaman.android': {
            device: 'android.emulator',
            app: 'xaman.android',
        },
        'android.attached+xaman.android': {
            device: 'android.attached',
            app: 'xaman.android',
        },
    },
};
