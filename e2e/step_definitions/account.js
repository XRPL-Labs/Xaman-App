const assert = require('assert');
const { Given, Then } = require('@cucumber/cucumber');
const { element, by, waitFor } = require('detox');

const {
    activateAccount,
    generateTestnetAccount,
    generateSecretNumbers,
    generateFamilySeed,
    generateMnemonic,
} = require('../helpers/fixtures');

Then('I write down secret numbers', async () => {
    this.numbers = [...Array(8)].map(() => Array(6));
    // rows
    for (let r = 0; r < 8; r++) {
        // get values for any column
        for (let c = 0; c < 6; c++) {
            const attributes = await element(by.id(`${r}.${c}`)).getAttributes();
            this.numbers[r][c] = attributes.text;
        }

        if (r < 7) {
            await element(by.id('next-button')).tap();
        }
    }
});

Then('I generate new secret number', async () => {
    this.numbers = generateSecretNumbers();
});

Then('I enter my secret number', { timeout: 5 * 60 * 1000 }, async () => {
    for (let r = 0; r < 8; r++) {
        // get values for any column
        for (let c = 0; c < 6; c++) {
            const attributes = await element(by.id(`${r}.${c}`)).getAttributes();
            const value = attributes.text;

            let diff = Number(value) - Number(this.numbers[r][c]);

            let pos = true;

            if (diff < 0) {
                pos = false;
            }

            diff = Math.abs(diff);

            for (let t = 0; t < diff; t++) {
                if (pos) {
                    await element(by.id('minus-btn')).tap();
                } else {
                    await element(by.id('plus-btn')).tap();
                }
            }

            await element(by.id('right-btn')).tap();
        }
    }
});

Then('I read my account address', async () => {
    const attributes = await element(by.id('account-address-text')).getAttributes();
    this.address = attributes.text;
});

Given('I should see same account address', async () => {
    const attributes = await element(by.id('account-address-text')).getAttributes();
    assert.equal(this.address, attributes.text);
});

Then('I activate the account', async () => {
    await activateAccount(this.address);
});

Then('I generate testnet account', async () => {
    const testnetAccount = await generateTestnetAccount();

    this.address = testnetAccount.address;
    this.seed = testnetAccount.secret;
});

Then('I enter the address in the input', async () => {
    await element(by.id('address-input')).typeText(`${this.address}\n`);
});

Then('I generate new family seed', async () => {
    this.seed = generateFamilySeed();
});

Then('I enter my seed in the input', async () => {
    await element(by.id('seed-input')).typeText(`${this.seed}\n`);
});

Then('I generate new mnemonic', async () => {
    this.mnemonic = generateMnemonic();
});

Then('I enter my mnemonic', async () => {
    for (let i = 0; i < 24; i++) {
        await element(by.id(`word-${i}-input`)).typeText(`${this.mnemonic[i]}\n`);
    }
});

Then('I tap my account in the list', async () => {
    // swipe up until we see the account in the list
    let isElementVisible = false;

    while (!isElementVisible) {
        try {
            await waitFor(element(by.id(`account-${this.address}`)))
                .toBeVisible()
                .withTimeout(200);

            isElementVisible = true;
        } catch {
            // ignore
        }

        if (!isElementVisible) {
            await element(by.id('account-list-scroll')).swipe('up', 'slow', 0.2);
        }
    }

    await element(by.id(`account-${this.address}`)).tap();
});
