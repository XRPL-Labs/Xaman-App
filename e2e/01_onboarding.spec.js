const { expect, element, by } = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');

describe('Onboarding', () => {
    beforeEach(async () => {
        await expect(element(by.id('onboarding-view'))).toBeVisible();
    });

    describe('Render', () => {
        it('should have skip button', async () => {
            await expect(element(by.id('skip-slider'))).toBeVisible();

            takeScreenshot();
        });

        it('should ready button after skip', async () => {
            await element(by.id('skip-slider')).tap();

            await expect(element(by.id('ready-slider'))).toBeVisible();

            takeScreenshot();

            await element(by.id('ready-slider')).tap();
        });
    });
});
