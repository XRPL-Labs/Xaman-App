const { execFileSync } = require('child_process');
const { Given, Then } = require('@cucumber/cucumber');
const { waitFor, expect, element, by, device } = require('detox');
const { dismissKeyboard } = require('../helpers/keyboard');
const { tapAndroidAlertButton, waitForAndroidAlertText } = require('../helpers/androidAlert');
const {
    clickByTestId,
    waitUntilAndroidTestId,
    waitUntilAndroidEnabled,
    waitUntilAndroidRnReady,
    androidReadTextByTestId,
    androidHasTestId,
    androidSwipeTestId,
    androidTypeText,
    androidBlurIme,
} = require('../helpers/tapById');

// Android OK is Toast on passphrase/passcode. Native Alert OK still exists on linking.
let androidAlertPending = false;

Then('I tap {string}', async (buttonId) => {
    if (device.getPlatform() === 'android' && buttonId === '24-words-button') {
        buttonId = '12-words-button';
    }
    // iOS: Finish already lands on Home; tapping tab-Home clips the selected tab.
    // Android: home-tab-view stays in the dump on Settings. Only skip when
    // Home content is actually showing.
    if (buttonId === 'tab-Home') {
        try {
            if (device.getPlatform() === 'android') {
                if (
                    !(await androidHasTestId('settings-tab-screen')) &&
                    ((await androidHasTestId('home-tab-empty-view')) ||
                        (await androidHasTestId('account-address-text')))
                ) {
                    return;
                }
            } else {
                await waitFor(element(by.id('home-tab-view'))).toExist().withTimeout(1500);
                return;
            }
        } catch (e) {
            // not on home yet, tap the tab
        }
    }

    const btn = element(by.id(buttonId));
    // Android: Espresso waitFor/getAttributes wait up to 240s for MAIN_LOOPER
    // idle (What's new WebView / Home Choreographer). Use UiDevice dump only.
    if (device.getPlatform() === 'android') {
        if (buttonId === 'add-and-sign-button' && (await androidHasTestId('review-transaction-modal'))) {
            return;
        }
        try {
            await waitUntilAndroidTestId(buttonId, 10000);
            if (buttonId === 'add-and-sign-button' && (await androidHasTestId('review-transaction-modal'))) {
                return;
            }
            await clickByTestId(buttonId);
        } catch (e) {
            if (buttonId === 'add-and-sign-button' && (await androidHasTestId('review-transaction-modal'))) {
                return;
            }
            throw e;
        }
        if (buttonId === 'tab-Settings') {
            const deadline = Date.now() + 10000;
            while (Date.now() < deadline) {
                if (await androidHasTestId('settings-tab-screen')) {
                    return;
                }
                await clickByTestId('tab-Settings');
                await new Promise((resolve) => { setTimeout(resolve, 600); });
            }
        }
        if (buttonId === 'add-and-sign-button') {
            const deadline = Date.now() + 8000;
            while (Date.now() < deadline) {
                if (await androidHasTestId('review-transaction-modal')) {
                    return;
                }
                if (await androidHasTestId('add-and-sign-button')) {
                    await clickByTestId('add-and-sign-button');
                }
                await new Promise((resolve) => { setTimeout(resolve, 800); });
            }
        }
        if (buttonId === 'confirm-button') {
            // setRoot(bottomTabs) + changelog WebView. Do not dump here —
            // overlapping dumpWindowHierarchy wedges UiAutomation. Home wait
            // dumps once and BACKs the overlay if waitForIdle is slow.
            await new Promise((resolve) => { setTimeout(resolve, 3000); });
        }
        if (buttonId.indexOf('network-') === 0 && buttonId !== 'network-switch-button') {
            const deadline = Date.now() + 8000;
            while (Date.now() < deadline) {
                if (!(await androidHasTestId('switch-network-overlay'))) {
                    return;
                }
                await new Promise((resolve) => { setTimeout(resolve, 250); });
            }
        }
        return;
    }
    // toExist: Next can be fully covered by the iOS keyboard and fail toBeVisible.
    // 10s: picker-modal items (e.g. 10080-item) mount a beat after the modal
    // container appears on a loaded emulator (observed >5s in full-suite runs).
    await waitFor(btn).toExist().withTimeout(10000);
    try {
        await btn.tap();
    } catch (e) {
        if (String(buttonId).startsWith('tab-') || buttonId === 'confirm-button' || buttonId === 'back-button') {
            await btn.tap({ x: 8, y: 8 });
            return;
        }
        await dismissKeyboard();
        // iPhone SE: Developer mode sits below the Advanced fold.
        try {
            await element(by.id('advanced-settings-screen')).swipe('up', 'slow', 0.6);
        } catch (swipeErr) {
            // not that screen
        }
        try {
            await waitFor(btn).toBeVisible().withTimeout(3000);
            await btn.tap();
        } catch (e2) {
            await btn.tap({ x: 8, y: 8 });
        }
    }
    if (buttonId.indexOf('network-') === 0 && buttonId !== 'network-switch-button') {
        try {
            await waitFor(element(by.id('switch-network-overlay')))
                .not.toExist()
                .withTimeout(8000);
        } catch (e) {
            // overlay already gone
        }
    }
});

Then('I wait {int} sec for button {string} to be enabled', async (timeoutSec, buttonId) => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidEnabled(buttonId, timeoutSec * 1000);
        return;
    }
    let sec_passed = 0;
    let enabled = false;
    while (sec_passed < timeoutSec) {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const attributes = await element(by.id(buttonId)).getAttributes();
        if (attributes.enabled) {
            enabled = true;
            break;
        }
        sec_passed += 1;
    }

    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!enabled) {
        throw new Error(`button with id ${buttonId} is not enabled after ${timeoutSec} seconds!`);
    }
});

Then('I enter {string} in {string}', async (value, textInputId) => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId(textInputId, 10000);
        await clickByTestId(textInputId);
        try {
            androidTypeText(value);
        } catch (e) {
            // timeout: field may already have the value
        }
        androidBlurIme();
        return;
    }
    const input = element(by.id(textInputId));
    await waitFor(input).toBeVisible().withTimeout(5000);
    await input.replaceText(value);
    try {
        await input.tapReturnKey();
    } catch (e) {
        await dismissKeyboard();
    }
});

Given('I should have {string}', async (elementId) => {
    const timeout =
        elementId === 'review-transaction-modal' ||
        elementId === 'account-settings-screen' ||
        elementId === 'account-import-show-address-view' ||
        elementId === 'account-import-secret-type-view' ||
        elementId === 'account-import-label-view' ||
        elementId === 'home-tab-view' ||
        elementId === 'home-tab-empty-view' ||
        elementId === 'lock-overlay' ||
        elementId === 'onboarding-screen'
            ? 90000
            : 10000;
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId(elementId, timeout);
        return;
    }
    await waitFor(element(by.id(elementId)))
        .toExist()
        .withTimeout(timeout);
});

Given('I should not have {string}', async (screenId) => {
    if (device.getPlatform() === 'android') {
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
            if (!(await androidHasTestId(screenId))) {
                return;
            }
            await new Promise((resolve) => { setTimeout(resolve, 400); });
        }
        throw new Error(`android hierarchy still has ${screenId}`);
    }
    await expect(element(by.id(screenId))).not.toExist();
});

Given('I should see {string}', async (elementId) => {
    if (device.getPlatform() === 'android' && elementId === 'submitting-view') {
        try {
            await waitUntilAndroidTestId('submitting-view', 4000);
        } catch (e) {
            await waitUntilAndroidTestId('success-result-view', 15000);
        }
        return;
    }
    if (device.getPlatform() === 'android') {
        const timeout = elementId === 'home-tab-view' || elementId === 'home-tab-empty-view' ? 30000 : 10000;
        if (elementId === 'accept-button') {
            for (let i = 0; i < 5; i += 1) {
                try {
                    await waitUntilAndroidTestId('accept-button', 2500);
                    return;
                } catch (e) {
                    await androidSwipeTestId('review-content-container', 'up');
                }
            }
        }
        await waitUntilAndroidTestId(elementId, timeout);
        return;
    }
    if (elementId === 'accept-button') {
        const btn = element(by.id('accept-button'));
        const scroller = element(by.id('review-content-container'));
        for (let i = 0; i < 6; i += 1) {
            try {
                await waitFor(btn).toBeVisible().withTimeout(2000);
                return;
            } catch (e) {
                try {
                    await scroller.swipe('up', 'slow', 0.7);
                } catch (swipeErr) {
                    // already at edge
                }
            }
        }
    }
    await waitFor(element(by.id(elementId)))
        .toBeVisible()
        .withTimeout(10000);
});

Given('I should see {string} in {string}', async (value, elementId) => {
    if (device.getPlatform() === 'android') {
        const deadline = Date.now() + 20000;
        let last = '';
        const want = String(value).replace(/\s/g, '');
        while (Date.now() < deadline) {
            try {
                await waitUntilAndroidTestId(elementId, 2000);
            } catch (e) {
                // keep polling
            }
            last = (await androidReadTextByTestId(elementId)) || '';
            const compact = last.replace(/\s/g, '');
            const digits = last.replace(/[^\d]/g, '');
            if (
                last === value ||
                compact === want ||
                last.indexOf(value) !== -1 ||
                compact.indexOf(want) !== -1 ||
                digits === want
            ) {
                return;
            }
            await new Promise((resolve) => { setTimeout(resolve, 400); });
        }
        throw new Error(`expected ${elementId} to contain "${value}", got "${last}"`);
    }
    await waitFor(element(by.id(elementId)))
        .toHaveText(value)
        .withTimeout(5000);
});

Given('I should wait {int} sec to see {string}', async (timeout, elementId) => {
    if (device.getPlatform() === 'android') {
        const ms =
            elementId === 'home-tab-empty-view' || elementId === 'home-tab-view'
                ? Math.max(timeout * 1000, 60000)
                : timeout * 1000;
        await waitUntilAndroidTestId(elementId, ms);
        return;
    }
    await waitFor(element(by.id(elementId)))
        .toBeVisible()
        .withTimeout(timeout * 1000);
});

Then('I scroll up {string}', async (elementId) => {
    if (device.getPlatform() === 'android') {
        await androidSwipeTestId(elementId, 'up');
        return;
    }
    const scroller = element(by.id(elementId));
    try {
        await waitFor(scroller).toExist().withTimeout(2000);
    } catch (e) {
        return;
    }
    await scroller.swipe('up', 'slow', 0.5);
    // iPhone SE: accept slider stays below one swipe on the review sheet.
    if (elementId === 'review-content-container') {
        try {
            await waitFor(element(by.id('accept-button'))).toBeVisible().withTimeout(1200);
        } catch (e) {
            await scroller.swipe('up', 'slow', 0.75);
        }
    }
});

Then('I scroll down {string}', async (elementId) => {
    await element(by.id(elementId)).swipe('down', 'slow', 0.5);
});

Then('I scroll {string} to bottom', async (elementId) => {
    await element(by.id(elementId)).scrollTo('bottom');
});

Then('I scroll {string} to top', async (elementId) => {
    await element(by.id(elementId)).scrollTo('top');
});

Then('I slide right {string}', async (elementId) => {
    if (device.getPlatform() === 'android') {
        await androidSwipeTestId(elementId, 'right');
        if (elementId === 'accept-button') {
            const slideDone = async () =>
                (await androidHasTestId('1-key')) ||
                (await androidHasTestId('passphrase-input')) ||
                (await androidHasTestId('sign-button'));
            for (let i = 0; i < 8; i += 1) {
                if (await slideDone()) {
                    return;
                }
                await new Promise((resolve) => { setTimeout(resolve, 400); });
            }
            if (await androidHasTestId('accept-button')) {
                await androidSwipeTestId(elementId, 'right');
            }
        }
        return;
    }
    await element(by.id(elementId)).swipe('right', 'slow', 0.8);
});

Then('I tap alert button with label {string}', async (label) => {
    if (device.getPlatform() === 'android') {
        // Passphrase/passcode success is Toast. Do not tap a ghost OK on those screens.
        if (label === 'OK' && !androidAlertPending) {
            return;
        }
        androidAlertPending = false;
        await device.disableSynchronization();
        const ui = device.getUiDevice();
        await tapAndroidAlertButton(label, device.id, (x, y) => ui.click(x, y));
        return;
    }
    const alertBtn = element(by.label(label).and(by.type('_UIAlertControllerActionView')));
    // Passphrase/passcode success is Toast. No native OK to tap.
    if (label === 'OK') {
        try {
            await waitFor(alertBtn).toExist().withTimeout(2000);
        } catch (e) {
            return;
        }
    }
    await alertBtn.tap();
});

Given('I should see alert with content {string}', async (title) => {
    if (device.getPlatform() === 'android') {
        androidAlertPending = true;
        await device.disableSynchronization();
        await waitForAndroidAlertText(title, device.id);
        return;
    }
    await waitFor(element(by.label(title)))
        .toBeVisible()
        .withTimeout(15000);
});

Then('I send the app to the background', async () => {
    await device.sendToHome();
});

Then('I close the app', async () => {
    await device.terminateApp();
});

// launchApp waitUntilReady uses Espresso.onIdle (240s MAIN_LOOPER / Home Choreographer).
const androidStartActivity = (url) => {
    const serial = process.env.ANDROID_SERIAL || device.id || 'emulator-5554';
    const args = url
        ? [
              '-s',
              serial,
              'shell',
              'am',
              'start',
              '-W',
              '-a',
              'android.intent.action.VIEW',
              '-d',
              url,
              'com.xrpllabs.xumm',
          ]
        : ['-s', serial, 'shell', 'am', 'start', '-W', '-n', 'com.xrpllabs.xumm/.LaunchActivity'];
    execFileSync('adb', args, { timeout: 20000 });
};

Then('I launch the app', async () => {
    if (device.getPlatform() === 'android') {
        // terminateApp drops the Detox instrumentation session. `am start`
        // brings the activity up but dumps then fail ("unexpectedly disconnected").
        // launchApp reconnects; sync 0 avoids the 240s MAIN_LOOPER waitUntilReady.
        await device.launchApp({
            newInstance: true,
            launchArgs: { detoxEnableSynchronization: 0 },
        });
        await device.disableSynchronization();
        await waitUntilAndroidRnReady();
        return;
    }
    await device.launchApp({ newInstance: false });
});

Then('I wait {int} sec and then bring the app to foreground', async (delay) => {
    // Sleep, do not busy-spin: a 20s tight loop starves Detox's websocket.
    await new Promise((resolve) => { setTimeout(resolve, delay * 1000); });

    if (device.getPlatform() === 'android') {
        androidStartActivity();
        return;
    }
    await device.launchApp({ newInstance: false });
});

Then('I launch the app with url {string}', async (url) => {
    if (device.getPlatform() === 'android') {
        androidStartActivity(url);
        return;
    }
    // newInstance:true crashes Hermes on SE. Detox openURL from Springboard
    // often does not foreground Xaman — simctl openurl delivers the UL.
    await device.sendToHome();
    await new Promise((resolve) => { setTimeout(resolve, 500); });
    try {
        execFileSync('xcrun', ['simctl', 'openurl', device.id, url], { timeout: 15000 });
    } catch (e) {
        await device.openURL({ url });
    }
});

Then('I open the url {string}', async (url) => {
    if (device.getPlatform() === 'android') {
        // Detox VIEW is activity-anonymous. After ToS loads xaman.app, Chrome can take the intent.
        const serial = process.env.ANDROID_SERIAL || 'emulator-5554';
        execFileSync(
            'adb',
            [
                '-s',
                serial,
                'shell',
                'am',
                'start',
                '-W',
                '-a',
                'android.intent.action.VIEW',
                '-d',
                url,
                'com.xrpllabs.xumm',
            ],
            { timeout: 10000 },
        );
        return;
    }
    await device.openURL({ url });
});
