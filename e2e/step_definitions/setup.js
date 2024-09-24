const { Then } = require('cucumber');
const { element, by, waitFor } = require('detox');

Then('I agree all disclaimers', async () => {
    for (let i = 0; i < 7; i++) {
        await waitFor(element(by.id('agree-check-box')))
            .toBeVisible()
            .withTimeout(20000);
        await element(by.id('agree-check-box')).tap();
    }
});
