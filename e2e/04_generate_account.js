const { expect, element, by } = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');

describe('Generate Account', () => {
    it('should render add account screen', async () => {
        await element(by.id('add-account-button')).tap();

        await expect(element(by.id('account-add-view'))).toBeVisible();

        takeScreenshot();
    });

    it('should render private key explanation', async () => {
        await element(by.id('account-generate-button')).tap();

        await expect(element(by.id('account-generate-explanation-private'))).toBeVisible();

        takeScreenshot();

        await element(by.id('next-button')).tap();
    });
    it('should render private key view', async () => {
        await expect(element(by.id('account-generate-view-private'))).toBeVisible();

        takeScreenshot();

        for (let i = 0; i < 7; i++) {
            await element(by.id('next-button')).tap();
        }

        takeScreenshot();

        await element(by.id('next-button')).tap();
    });
});
