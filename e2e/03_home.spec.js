const { expect, element, by } = require('detox');
const { takeScreenshot } = require('./helpers/screenshot');

describe('Home', () => {
    describe('Tabs', () => {
        it('should render empty home tab', async () => {
            await expect(element(by.id('home-tab-empty-view'))).toBeVisible();

            takeScreenshot();

            await element(by.id('tab-Events')).tap();
        });

        it('should render empty events tab', async () => {
            await expect(element(by.id('events-tab-empty-view'))).toBeVisible();

            takeScreenshot();

            await element(by.id('tab-Profile')).tap();
        });
        it('should render empty profile tab', async () => {
            await expect(element(by.id('profile-tab-view'))).toBeVisible();

            takeScreenshot();

            await element(by.id('tab-Settings')).tap();
        });

        it('should render settings tab', async () => {
            await expect(element(by.id('settings-tab-view'))).toBeVisible();

            takeScreenshot();

            await element(by.id('tab-Home')).tap();
        });
    });
});
