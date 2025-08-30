const { Then } = require('@cucumber/cucumber');
const { expect, element, by } = require('detox');

let passcode = '167349';

const passphrase = '&uHCnPv4T=#~;Ca';
const newPassphrase = '4b<8xu8HbP)%hzpgh';

Then('I enter my passcode', async () => {
    await expect(element(by.id('virtual-keyboard'))).toExist();

    const passcodeArray = passcode.split('');

    for (let i = 0; i < passcodeArray.length; i++) {
        await element(by.id(`${passcodeArray[i]}-key`)).tap();
    }
});

Then('I type my passcode', async () => {
    // await element(by.id('pin-input')).typeText(`${passcode}\n`);
    await element(by.id(`${passcode[0]}-key`)).tap();
    await element(by.id(`${passcode[1]}-key`)).tap();
    await element(by.id(`${passcode[2]}-key`)).tap();
    await element(by.id(`${passcode[3]}-key`)).tap();
    await element(by.id(`${passcode[4]}-key`)).tap();
    await element(by.id(`${passcode[5]}-key`)).tap();
});

Then('I type my new passcode', async () => {
    passcode = '958347';
    // await element(by.id('pin-input')).typeText(`${passcode}\n`);
    await element(by.id(`${passcode[0]}-key`)).tap();
    await element(by.id(`${passcode[1]}-key`)).tap();
    await element(by.id(`${passcode[2]}-key`)).tap();
    await element(by.id(`${passcode[3]}-key`)).tap();
    await element(by.id(`${passcode[4]}-key`)).tap();
    await element(by.id(`${passcode[5]}-key`)).tap();
});

Then('I enter my passphrase in {string}', async (input) => {
    await element(by.id(input)).typeText(`${passphrase}\n`);
});

Then('I enter my new passphrase in {string}', async (input) => {
    await element(by.id(input)).typeText(`${newPassphrase}\n`);
});
