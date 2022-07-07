const { Given, Then } = require('cucumber');
const { waitFor, expect, element, by, device } = require('detox');

Then('I tap {string}', async (buttonId) => {
    await waitFor(element(by.id(buttonId)))
        .toBeVisible()
        .withTimeout(5000);
    await element(by.id(buttonId)).tap();
});

Then('I wait {int} sec for button {string} to be enabled', async (timeoutSec, buttonId) => {
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
    await element(by.id(textInputId)).typeText(value);
});

Given('I should have {string}', async (screenId) => {
    await expect(element(by.id(screenId))).toExist();
});

Given('I should not have {string}', async (screenId) => {
    await expect(element(by.id(screenId))).not.toExist();
});

Given('I should see {string}', async (elementId) => {
    await waitFor(element(by.id(elementId)))
        .toBeVisible()
        .withTimeout(5000);
});

Given('I should see {string} in {string}', async (value, elementId) => {
    await waitFor(element(by.id(elementId)))
        .toHaveText(value)
        .withTimeout(5000);
});

Given('I should wait {int} sec to see {string}', async (timeout, elementId) => {
    await waitFor(element(by.id(elementId)))
        .toBeVisible()
        .withTimeout(timeout * 1000);
});

Then('I scroll up {string}', async (elementId) => {
    await element(by.id(elementId)).swipe('up', 'slow', 0.2);
});

Then('I scroll down {string}', async (elementId) => {
    await element(by.id(elementId)).swipe('down', 'slow', 0.2);
});

Then('I scroll {string} to bottom', async (elementId) => {
    await element(by.id(elementId)).scrollTo('bottom');
});

Then('I scroll {string} to top', async (elementId) => {
    await element(by.id(elementId)).scrollTo('top');
});

Then('I slide right {string}', async (elementId) => {
    await element(by.id(elementId)).swipe('right', 'slow', 0.8);
});

Then('I tap alert button with label {string}', async (label) => {
    await element(by.label(label).and(by.type('_UIAlertControllerActionView'))).tap();
});

Given('I should see alert with content {string}', async (title) => {
    await expect(element(by.label(title))).toBeVisible();
});

Then('I send the app to the background', async () => {
    await device.sendToHome();
});

Then('I close the app', async () => {
    await device.terminateApp();
});

Then('I launch the app', async () => {
    await device.launchApp({ newInstance: false });
});

Then('I wait {int} sec and then bring the app to foreground', async (delay) => {
    // delay
    const start = new Date().getTime();
    while (new Date().getTime() < start + delay * 1000);

    await device.launchApp({ newInstance: false });
});

Then('I launch the app with url {string}', async (url) => {
    await device.relaunchApp({ url });
});

Then('I open the url {string}', async (url) => {
    await device.openURL({ url });
});
