try {
    if (process.stdout._handle && typeof process.stdout._handle.setBlocking === 'function') {
        process.stdout._handle.setBlocking(true);
    }
} catch (e) {
    // keep going if stdout is not a handle
}

const detox = require('detox/internals');

const { device, element, by, waitFor } = require('detox');
const { Before, BeforeAll, AfterAll, After, BeforeStep, AfterStep } = require('@cucumber/cucumber');
const adapter = require('./adapter');

const {
    setDeviceUdid,
    setScreenshotPlatform,
    nextStepIndex,
    takeNamedScreenshot,
    startRecordingVideo,
    stopRecordingVideo,
} = require('../helpers/artifacts');
const { startDeviceLogStream } = require('../helpers/simulator');
const { checkNetwork, ensureLocalSimulator } = require('./preflight');
const {
    tapByTestIdIfPresent,
    unlockAndroidPasscodeIfPresent,
    waitUntilAndroidRnReady,
    disableAndroidStylusHandwriting,
    restoreAndroidAnimationScale,
    clearAndroidBlockingDialogs,
    adbTapChangelogClose,
} = require('../helpers/tapById');

BeforeAll(async () => {
    // fail fast with a clear message when the suite cannot possibly pass
    await checkNetwork();
    ensureLocalSimulator();

    const reuse = String(process.env?.DETOX_REUSE || 'no').toLowerCase() === 'yes';
    const newInstance =
        String(process.env?.DETOX_NEW_INSTANCE || '').toLowerCase() === 'yes' ? true : !reuse;

    await detox.init({
        argv: {
            reuse,
        },
    });

    // target the detox-managed simulator, not whatever happens to be "booted"
    setDeviceUdid(device.id);
    setScreenshotPlatform(device.getPlatform());

    // start device log
    startDeviceLogStream(device.id);

    // start recording video
    startRecordingVideo();

    await device.launchApp({
        newInstance,
        permissions: { notifications: 'YES', camera: 'YES' },
        disableTouchIndicators: false,
        // Must be set at launch. Android RN Animated (Toast) trips
        // AnimatedModuleIdlingResource during "ready".
        launchArgs:
            process.env.DETOX_CONFIGURATION && String(process.env.DETOX_CONFIGURATION).startsWith('android.')
                ? { detoxEnableSynchronization: 0 }
                : undefined,
    });

    if (device.getPlatform() === 'android') {
        await device.disableSynchronization();
        disableAndroidStylusHandwriting();
        await waitUntilAndroidRnReady();
        await clearAndroidBlockingDialogs();
        await unlockAndroidPasscodeIfPresent();
    } else {
        // iPhone SE: Firebase/main-queue idling hides onboarding-screen for 90s.
        await device.disableSynchronization();
    }

    await device.setURLBlacklist([
        '.*xumm.app.*',
        '.*xaman.app.*',
        // Fresh sim: Firebase checkin holds Detox iOS sync and misses agreement-setup-screen.
        '.*device-provisioning.googleapis.com.*',
        '.*firebaseinstallations.googleapis.com.*',
        '.*firebase.googleapis.com.*',
        '.*firebaselogging.googleapis.com.*',
        '.*app-measurement.com.*',
    ]);
});

// On fresh Android installs the app auto-opens the "What's new" release-notes
// modal shortly after launch; its full-screen backdrop swallows taps on the
// screen underneath. Close it before every scenario if it is up (by testID).
async function dismissChangelogOverlay() {
    // Dump + UiDevice only. Espresso waitFor on this overlay waits for MAIN_LOOPER idle.
    await tapByTestIdIfPresent('close-change-log-button', 1500);
    if (device.getPlatform() === 'android') {
        await adbTapChangelogClose();
    }
}

async function dismissIosLockIfPresent() {
    if (device.getPlatform() !== 'ios') {
        return;
    }
    try {
        await waitFor(element(by.id('lock-overlay')))
            .toExist()
            .withTimeout(800);
    } catch (e) {
        return;
    }
    const pin = String(process.env.E2E_PASSCODE || '167349');
    for (let i = 0; i < pin.length; i += 1) {
        await element(by.id(`${pin[i]}-key`)).tap();
    }
    await waitFor(element(by.id('lock-overlay')))
        .not.toExist()
        .withTimeout(10000);
}

Before(async (context) => {
    await unlockAndroidPasscodeIfPresent();
    await dismissIosLockIfPresent();
    await dismissChangelogOverlay();
    await adapter.beforeEach(context);
});

BeforeStep(async (context) => {
    nextStepIndex();
    takeNamedScreenshot(`before-${context.pickleStep.text}`);
});

AfterStep(async (context) => {
    const status = context.result && context.result.status ? context.result.status : 'UNKNOWN';
    takeNamedScreenshot(`after-${status}-${context.pickleStep.text}`);
});

After(async (context) => {
    if (context.result && context.result.status === 'FAILED') {
        takeNamedScreenshot(`FAIL-${context.pickle.name}`);
    }
    await adapter.afterEach(context);
});

AfterAll(async () => {
    if (device.getPlatform() === 'android') {
        restoreAndroidAnimationScale();
    }

    // clean up
    await detox.cleanup();

    // stop recording
    stopRecordingVideo();
});
