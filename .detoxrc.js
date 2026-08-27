module.exports = {
    behavior: {
        init: {
            reinstallApp: false,
        },
    },
    apps: {
        'xaman.ios': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Xaman.app',
            build: 'xcodebuild -workspace ios/Xaman.xcworkspace -scheme Xaman -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
        },
        // Debug + Metro install already on the iPhone 17 Pro (Xcode Run). Attach only — do not rebuild.
        'xaman.ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Xaman.app',
        },
        'xaman.android': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-x86_64-release.apk',
            build: 'cd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && cd ..',
        },
        // Apple Silicon AVD Xaman_API36 — never point Detox at the USB phone
        'xaman.android.arm64': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-arm64-v8a-release.apk',
            testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
            build: 'cd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && cd ..',
        },
        // Debug + Metro: androidTest is not R8-minified (release test APK strips JUnit).
        'xaman.android.debug.arm64': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk',
            testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
            build: 'cd android && ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug && cd ..',
        },
    },
    devices: {
        'ios.simulator': {
            type: 'ios.simulator',
            headless: process.env.CI ? true : undefined,
            device: { type: 'iPhone 16 Pro' },
        },
        // dedicated local simulator so e2e runs never wipe the dev simulator's app state
        // create it once with: xcrun simctl create "Xaman-e2e" "iPhone 16 Pro"
        'ios.simulator.local': {
            type: 'ios.simulator',
            device: { name: 'Xaman-e2e' },
        },
        'ios.simulator.dev': {
            type: 'ios.simulator',
            device: { name: 'iPhone 17 Pro' },
        },
        'ios.simulator.se': {
            type: 'ios.simulator',
            device: { name: 'Xaman-se' },
        },
        'android.emulator': {
            type: 'android.emulator',
            device: { avdName: 'Nexus_5X_API_28' },
        },
        // dedicated API 36 ARM emulator — do not use android.attached (would wipe SM-M215F)
        'android.emulator.local': {
            type: 'android.emulator',
            device: { avdName: 'Xaman_API36' },
        },
        'android.attached': {
            type: 'android.attached',
            device: {
                adbName: '.*',
            },
        },
        // SM-M215F only — never let android.attached '.*' pick the emulator
        'android.attached.usb': {
            type: 'android.attached',
            device: { adbName: 'R58NA2ZV7TK' },
        },
    },
    configurations: {
        'ios.simulator+xaman.ios': {
            device: 'ios.simulator',
            app: 'xaman.ios',
        },
        'ios.simulator.local+xaman.ios': {
            device: 'ios.simulator.local',
            app: 'xaman.ios',
        },
        'ios.simulator.local+xaman.ios.debug': {
            device: 'ios.simulator.local',
            app: 'xaman.ios.debug',
        },
        'ios.simulator.dev+xaman.ios.debug': {
            device: 'ios.simulator.dev',
            app: 'xaman.ios.debug',
        },
        'ios.simulator.se+xaman.ios': {
            device: 'ios.simulator.se',
            app: 'xaman.ios',
        },
        'android.emulator+xaman.android': {
            device: 'android.emulator',
            app: 'xaman.android',
        },
        'android.emulator.local+xaman.android.arm64': {
            device: 'android.emulator.local',
            app: 'xaman.android.arm64',
        },
        'android.emulator.local+xaman.android.debug.arm64': {
            device: 'android.emulator.local',
            app: 'xaman.android.debug.arm64',
        },
        'android.attached+xaman.android': {
            device: 'android.attached',
            app: 'xaman.android',
        },
        'android.attached.usb+xaman.android.debug.arm64': {
            device: 'android.attached.usb',
            app: 'xaman.android.debug.arm64',
        },
    },
};
