const { element, by, waitFor, device } = require('detox');

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

// Screens that host a text field + a footer Next under the iOS keyboard.
const CHROME_IDS = [
    'account-generate-label-view',
    'account-generate-passphrase-view',
    'account-import-enter-family-seed-view',
    'account-import-label-view',
    'account-import-enter-mnemonic-view',
    'account-import-enter-address-view',
    'account-import-passphrase-view',
];

// Do not swipe UIKeyboardLayoutStar: on iOS 26 that swipe hits the keys
// (we typed "To to to to" into the label) instead of dismissing.
const dismissKeyboard = async () => {
    // iOS-only. On Android, label "done" matches IME keys and Detox can hang
    // for the cucumber timeout (we lost 6+ minutes on add-and-sign-button).
    if (device.getPlatform() === 'android') {
        return;
    }

    try {
        await element(by.traits(['keyboardKey']).and(by.label('return'))).tap();
        await sleep(250);
        return;
    } catch (e) {
        // no return key
    }

    try {
        await element(by.traits(['keyboardKey']).and(by.label('done'))).tap();
        await sleep(250);
        return;
    } catch (e) {
        // no done key
    }

    for (const id of CHROME_IDS) {
        try {
            await waitFor(element(by.id(id))).toExist().withTimeout(150);
            // Far left of the title. Center taps hit 16-word or Scan QR.
            const x = id === 'account-import-enter-mnemonic-view' ? 12 : 200;
            const y = id === 'account-import-enter-mnemonic-view' ? 4 : 70;
            await element(by.id(id)).tap({ x, y });
            await sleep(300);
            return;
        } catch (e) {
            // not this screen
        }
    }
};

module.exports = { dismissKeyboard };
