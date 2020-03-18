const { expect, element, by, waitFor } = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');

describe('Setup', () => {
    beforeEach(async () => {
        it('should render passcode setup', async () => {
            await expect(element(by.id('setup-passcode-view'))).toBeVisible();
        });
    });

    describe('Passcode', () => {
        it('should render passcode explanation', async () => {
            await expect(element(by.id('pin-code-explanation'))).toBeVisible();

            takeScreenshot();
            await element(by.id('go-button')).tap();
        });

        it('should show passcode entry', async () => {
            await expect(element(by.id('pin-code-entry'))).toExist();

            takeScreenshot();
        });

        it('should fill the pin input', async () => {
            await element(by.id('pinInput')).replaceText('000000');

            takeScreenshot();

            await element(by.id('next-button')).tap();
        });

        it('should fill the pin input confirm', async () => {
            await element(by.id('pinInput')).replaceText('000000');

            takeScreenshot();

            await element(by.id('next-button')).tap();
        });
    });

    describe('Biometric', () => {
        it('should render biometric step', async () => {
            await waitFor(element(by.id('biometric-setup-view')))
                .toBeVisible()
                .withTimeout(2000);

            takeScreenshot();

            await element(by.id('skip-button')).tap();
        });
    });

    describe('Finish', () => {
        it('should render finish step', async () => {
            await waitFor(element(by.id('agreement-setup-view')))
                .toBeVisible()
                .withTimeout(2000);

            takeScreenshot();

            await element(by.id('confirm-button')).tap();
        });
    });
});
