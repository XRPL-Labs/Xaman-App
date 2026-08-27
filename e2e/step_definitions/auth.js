const { execFileSync } = require('child_process');
const { Then } = require('@cucumber/cucumber');
const { expect, element, by, waitFor, device } = require('detox');
const { dismissKeyboard } = require('../helpers/keyboard');
const { clickByTestId, waitUntilAndroidTestId, enterAndroidPasscode, androidTypeText } = require('../helpers/tapById');

let passcode = process.env.E2E_PASSCODE || '167349';

const passphrase = '&uHCnPv4T=#~;Ca';
const newPassphrase = '4b<8xu8HbP)%hzpgh';

Then('I enter my passcode', async () => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId('1-key', 10000);
        await new Promise((resolve) => { setTimeout(resolve, 800); });
        await enterAndroidPasscode(passcode);
        return;
    }
    await expect(element(by.id('virtual-keyboard'))).toExist();
    const passcodeArray = passcode.split('');
    for (let i = 0; i < passcodeArray.length; i++) {
        await clickByTestId(`${passcodeArray[i]}-key`);
    }
});

Then('I type my passcode', async () => {
    if (device.getPlatform() === 'android') {
        try {
            await waitUntilAndroidTestId('1-key', 10000);
            await enterAndroidPasscode(passcode);
            return;
        } catch (e) {
            try {
                await waitUntilAndroidTestId('account-access-level-value', 1500);
                return;
            } catch (skipErr) {
                throw e;
            }
        }
    }
    try {
        await waitFor(element(by.id(`${passcode[0]}-key`)).atIndex(0))
            .toExist()
            .withTimeout(10000);
    } catch (e) {
        try {
            await waitFor(element(by.id('account-access-level-value')))
                .toHaveText('Read only')
                .withTimeout(1500);
            return;
        } catch (skipErr) {
            throw e;
        }
    }
    await device.disableSynchronization();
    try {
        const digits = passcode.split('');
        for (let i = 0; i < digits.length; i += 1) {
            await element(by.id(`${digits[i]}-key`)).atIndex(0).tap();
        }
    } finally {
        try {
            await device.enableSynchronization();
        } catch (e) {
            // overlay already gone
        }
    }
});

Then('I type my new passcode', async () => {
    passcode = '958347';
    if (device.getPlatform() === 'android') {
        await enterAndroidPasscode(passcode);
        return;
    }
    await clickByTestId(`${passcode[0]}-key`);
    await clickByTestId(`${passcode[1]}-key`);
    await clickByTestId(`${passcode[2]}-key`);
    await clickByTestId(`${passcode[3]}-key`);
    await clickByTestId(`${passcode[4]}-key`);
    await clickByTestId(`${passcode[5]}-key`);
});

const typeIntoField = async (inputId, value) => {
    const field = element(by.id(inputId));
    if (device.getPlatform() === 'android') {
        const serial = process.env.ANDROID_SERIAL || device.id;
        await waitUntilAndroidTestId(inputId, 15000);
        await clickByTestId(inputId);
        try {
            execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '123'], { timeout: 3000 });
            const n = Math.max(24, String(value).length + 8);
            for (let i = 0; i < n; i += 1) {
                execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '67'], { timeout: 2000 });
            }
        } catch (e) {
            // empty field
        }
        androidTypeText(value);
        try {
            execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '111'], { timeout: 8000 });
        } catch (e) {
            // IME already down
        }
        return;
    }
    await waitFor(field).toBeVisible().withTimeout(5000);
    try {
        await field.tap();
    } catch (e) {
        await field.tap({ x: 8, y: 8 });
    }
    await field.replaceText(value);
    try {
        await field.tapReturnKey();
    } catch (e) {
        await dismissKeyboard();
    }
};

Then('I enter my passphrase in {string}', async (input) => {
    // Android `input text` drops `& # ~ ; =`, so setup and sign stored different secrets.
    const value = device.getPlatform() === 'android' ? 'uHCnPv4TCa7xQmK9' : passphrase;
    await typeIntoField(input, value);
});

Then('I enter my new passphrase in {string}', async (input) => {
    // Android IME mangles `< % )` so the confirm field does not match.
    const value = device.getPlatform() === 'android' ? '4b8xu8HbPhzpghXX' : newPassphrase;
    await typeIntoField(input, value);
});
