const assert = require('assert');
const { execFileSync } = require('child_process');
const { Given, Then } = require('@cucumber/cucumber');
const { element, by, waitFor, device } = require('detox');

const {
    activateAccount,
    generateTestnetAccount,
    generateFreshTestnetAccount,
    generateSecretNumbers,
    generateFamilySeed,
    generateMnemonic,
    deriveMnemonicAddress,
    deriveFamilySeedAddress,
    SAMPLE_24_WORD_MNEMONIC,
    SAMPLE_FAMILY_SEED_ED_XAHAU,
    SAMPLE_FAMILY_SEED_ED_ADDRESS,
    SAMPLE_FAMILY_SEED_SECP_ADDRESS,
} = require('../helpers/fixtures');
const { dismissKeyboard } = require('../helpers/keyboard');
const { waitForAndroidAlertText } = require('../helpers/androidAlert');
const {
    clickByTestId,
    waitUntilAndroidTestId,
    androidReadTextByTestId,
    androidHasTestId,
    clickAndroidAccountRow,
    androidReadSecretRow,
    enterAndroidSecretNumbers,
    androidTypeText,
    androidBlurIme,
    isAdbTimeout,
    androidDumpIncludes,
    clickAndroidLabel,
} = require('../helpers/tapById');

Then('I write down secret numbers', { timeout: 10 * 60 * 1000 }, async () => {
    this.numbers = [...Array(8)].map(() => Array(6));
    for (let r = 0; r < 8; r++) {
        if (device.getPlatform() === 'android') {
            this.numbers[r] = await androidReadSecretRow(r);
            if (r < 7) {
                await clickByTestId('next-button');
                try {
                    await waitUntilAndroidTestId(`${r + 1}.0`, 8000);
                } catch (e) {
                    await clickByTestId('next-button');
                    await waitUntilAndroidTestId(`${r + 1}.0`, 10000);
                }
            }
        } else {
            for (let c = 0; c < 6; c++) {
                const attributes = await element(by.id(`${r}.${c}`)).getAttributes();
                this.numbers[r][c] = attributes.text;
            }
            if (r < 7) {
                await element(by.id('next-button')).tap();
            }
        }
    }
});

Then('I generate new secret number', async () => {
    this.numbers = generateSecretNumbers();
});

Then('I enter my secret number', { timeout: 5 * 60 * 1000 }, async () => {
    if (device.getPlatform() === 'android') {
        await enterAndroidSecretNumbers(this.numbers);
        return;
    }
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
            await element(by.id(`${this.numbers[r][c]}-key`)).tap();
        }
    }
});

Then('I read my account address', async () => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId('account-address-text', 15000);
        this.address = await androidReadTextByTestId('account-address-text');
        return;
    }
    const attributes = await element(by.id('account-address-text')).getAttributes();
    this.address = attributes.text;
});

Given('I should see same account address', async () => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId('account-address-text', 15000);
        const text = await androidReadTextByTestId('account-address-text');
        assert.equal(this.address, text);
        return;
    }
    const attributes = await element(by.id('account-address-text')).getAttributes();
    assert.equal(this.address, attributes.text);
});

Then('I activate the account', async () => {
    await activateAccount(this.address);
});

Then('I generate testnet account', async () => {
    const testnetAccount = await generateFreshTestnetAccount();

    this.address = testnetAccount.address;
    this.seed = testnetAccount.secret;
    if (!this.address || this.address[0] !== 'r') {
        throw new Error(`testnet address expected r... got ${this.address}`);
    }
});

Then('I enter the address in the input', async () => {
    if (device.getPlatform() === 'android') {
        const serial = process.env.ANDROID_SERIAL || device.id;
        const want = String(this.address || '');
        await waitUntilAndroidTestId('address-input', 10000);
        await clickByTestId('address-input');
        await new Promise((resolve) => { setTimeout(resolve, 400); });
        androidTypeText(want);
        await new Promise((resolve) => { setTimeout(resolve, 500); });
        const readField = async () => {
            const raw = String((await androidReadTextByTestId('address-input')) || '');
            if (raw.indexOf('Please enter') !== -1) {
                return '';
            }
            return raw.replace(/\s/g, '');
        };
        let got = await readField();
        // IME often swallows the leading `r` (`rZZx…` → `ZZx…`), which leaves Next disabled.
        if (got !== want && got.indexOf(want) === -1) {
            if (want.endsWith(got) && got.length > 0) {
                execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '122'], { timeout: 3000 });
                androidTypeText(want.slice(0, want.length - got.length));
            } else {
                execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '123'], { timeout: 3000 });
                const n = Math.max(40, got.length + 8);
                for (let i = 0; i < n; i += 1) {
                    execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '67'], { timeout: 2000 });
                }
                androidTypeText(want);
            }
            await new Promise((resolve) => { setTimeout(resolve, 400); });
            got = await readField();
        }
        if (got !== want && got.indexOf(want) === -1) {
            throw new Error(`address-input got ${JSON.stringify(got)} want ${want}`);
        }
        // BACK while focused can immediately reopen IME; ESC blurs.
        try {
            execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '111'], { timeout: 4000 });
        } catch (e) {
            // IME
        }
        return;
    }
    const input = element(by.id('address-input'));
    await input.replaceText(this.address);
    try {
        await input.tapReturnKey();
    } catch (e) {
        await dismissKeyboard();
    }
});

Then('I generate new family seed', async () => {
    this.seed = generateFamilySeed();
});

Then('I enter my seed in the input', async () => {
    if (!this.seed) {
        const acc = await generateTestnetAccount();
        this.address = acc.address;
        this.seed = acc.secret;
    }
    if (device.getPlatform() === 'android') {
        const serial = process.env.ANDROID_SERIAL || device.id;
        const want = String(this.seed || '');
        const sleepMs = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
        const clearField = () => {
            execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '123'], { timeout: 3000 });
            const n = Math.max(40, want.length + 8);
            for (let i = 0; i < n; i += 1) {
                execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '67'], { timeout: 2000 });
            }
        };
        const seedLooksValid = async () =>
            (await androidDumpIncludes('secp256k1')) ||
            (await androidDumpIncludes('ed25519')) ||
            (await androidDumpIncludes('Keypair curve')) ||
            (await androidDumpIncludes('Keypair type'));
        const readVisibleSeed = async () => {
            const raw = String((await androidReadTextByTestId('seed-input')) || '');
            if (!raw || /please|provide|family seed|secret/i.test(raw) || /^[•·.●]+$/.test(raw)) {
                return '';
            }
            return raw.replace(/\s/g, '');
        };

        await waitUntilAndroidTestId('seed-input', 10000);
        await clickByTestId('seed-input');
        await sleepMs(400);
        try {
            androidTypeText(want);
        } catch (e) {
            if (!isAdbTimeout(e)) {
                throw e;
            }
        }
        await sleepMs(400);
        // Timeout often happens after the seed is already in the field
        // (secp256k1 picker is up). Recover: dump, blur IME, do not Next here.
        if (await seedLooksValid()) {
            androidBlurIme();
            return;
        }

        // IME often capitalizes/swallows the leading `s`, so Next alerts Invalid Family Seed.
        if (!(await seedLooksValid())) {
            await clickAndroidLabel('Show secret');
            await sleepMs(300);
            await clickByTestId('seed-input');
            await sleepMs(200);
            const got = await readVisibleSeed();
            try {
                if (want.endsWith(got) && got.length > 0 && got !== want) {
                    execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '122'], { timeout: 3000 });
                    androidTypeText(want.slice(0, want.length - got.length));
                } else {
                    clearField();
                    androidTypeText(want);
                }
            } catch (e) {
                if (!isAdbTimeout(e)) {
                    throw e;
                }
            }
            await sleepMs(400);
        }

        if (!(await seedLooksValid()) && !/^sed/i.test(want)) {
            await clickByTestId('seed-input');
            await sleepMs(200);
            clearField();
            try {
                androidTypeText(want);
            } catch (e) {
                if (!isAdbTimeout(e)) {
                    throw e;
                }
            }
            await sleepMs(400);
        }

        if (!(await seedLooksValid()) && !/^sed/i.test(want)) {
            throw new Error('seed-input did not produce a valid family seed (keypair picker hidden)');
        }
        androidBlurIme();
        return;
    }
    const input = element(by.id('seed-input'));
    await input.replaceText(this.seed);
    try {
        await input.tapReturnKey();
    } catch (e) {
        await dismissKeyboard();
    }
});

Then('I generate new mnemonic', async () => {
    // 24 rows do not fit the 1080x2400 AVD. 12 words is a valid BIP39
    // strength-128 mnemonic and stays on screen.
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId('12-words-button', 10000);
        await clickByTestId('12-words-button');
        this.mnemonic = generateMnemonic(128);
        return;
    }
    this.mnemonic = generateMnemonic();
});

Then('I generate new mnemonic with ed25519', async () => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId('12-words-button', 10000);
        await clickByTestId('12-words-button');
        this.mnemonic = generateMnemonic(128, 'ed25519');
        return;
    }
    this.mnemonic = generateMnemonic(256, 'ed25519');
});

const sleepMs = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const tapTestId = async (id, timeout = 10000) => {
    const btn = element(by.id(id));
    try {
        await waitFor(btn).toBeVisible().withTimeout(timeout);
    } catch (e) {
        await waitFor(btn).toExist().withTimeout(timeout);
    }
    await sleepMs(250);
    try {
        await btn.tap();
    } catch (e) {
        await btn.tap({ x: 8, y: 8 });
    }
};

const tapUntilScreen = async (buttonId, screenId, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    let lastErr;
    while (Date.now() < deadline) {
        try {
            await waitFor(element(by.id(screenId)))
                .toExist()
                .withTimeout(800);
            await sleepMs(300);
            return;
        } catch (e) {
            lastErr = e;
        }
        try {
            await tapTestId(buttonId, 4000);
        } catch (tapErr) {
            lastErr = tapErr;
        }
        await sleepMs(400);
    }
    throw lastErr || new Error(`screen ${screenId} did not appear after tapping ${buttonId}`);
};

const tryTapAlertLabel = async (label) => {
    const alertBtn = element(by.label(label).and(by.type('_UIAlertControllerActionView')));
    try {
        await waitFor(alertBtn).toExist().withTimeout(200);
        await alertBtn.tap();
        return true;
    } catch (e) {
        return false;
    }
};

Then('I leave account import if open', async () => {
    await dismissKeyboard();
    try {
        await waitFor(element(by.id('lock-overlay')))
            .toExist()
            .withTimeout(400);
        const pin = String(process.env.E2E_PASSCODE || '958347');
        for (let i = 0; i < pin.length; i += 1) {
            await element(by.id(`${pin[i]}-key`)).tap();
        }
        await waitFor(element(by.id('lock-overlay')))
            .not.toExist()
            .withTimeout(10000);
    } catch (lockErr) {
        // already unlocked
    }

    // Only treat tab-hosting screens as done. accounts-list and add-account hide
    // the tab bar, so later scenarios cannot tap tab-Settings from there.
    const doneIds = ['network-switch-button', 'home-tab-view', 'settings-tab-screen'];
    const alertLabels = ['Go back', 'Cancel', 'OK', 'No'];

    leaveLoop: for (let i = 0; i < 20; i += 1) {
        for (let d = 0; d < doneIds.length; d += 1) {
            try {
                await waitFor(element(by.id(doneIds[d])))
                    .toBeVisible()
                    .withTimeout(350);
                return;
            } catch (e) {
                // not on this screen
            }
        }

        try {
            await waitFor(element(by.id('picker-modal')))
                .toExist()
                .withTimeout(250);
            try {
                await element(by.id('back-button')).tap();
            } catch (backErr) {
                await element(by.id('picker-modal')).tap({ x: 24, y: 56 });
            }
            await sleepMs(250);
            continue;
        } catch (pickerErr) {
            // not on picker
        }

        for (let a = 0; a < alertLabels.length; a += 1) {
            if (await tryTapAlertLabel(alertLabels[a])) {
                await sleepMs(250);
                continue leaveLoop;
            }
        }

        try {
            await element(by.id('back-button')).tap();
            await sleepMs(250);
            continue;
        } catch (backErr) {
            // no footer/header back
        }

        try {
            await waitFor(element(by.id('account-add-screen')))
                .toExist()
                .withTimeout(250);
            await element(by.id('account-add-screen')).tap({ x: 24, y: 80 });
            await sleepMs(250);
            continue;
        } catch (addErr) {
            // not on add-account
        }

        try {
            await element(by.id('tab-Home')).tap();
        } catch (homeErr) {
            // keep trying
        }
    }

    throw new Error('still inside account import after leave attempts');
});

Then('I open the family seed import screen', async () => {
    await tapUntilScreen('tab-Settings', 'settings-tab-screen');
    await tapUntilScreen('accounts-button', 'accounts-list-screen');
    await tapUntilScreen('add-account-button', 'account-add-screen');
    await tapUntilScreen('account-import-button', 'account-import-access-level-view');
    await tapUntilScreen('next-button', 'account-import-secret-type-view');
    await tapTestId('family-seed-radio-button');
    await tapUntilScreen('next-button', 'account-import-enter-family-seed-view');
});

Then('I remember family seed address for curve {string}', async (curve) => {
    this.expectedFamilySeedAddress = deriveFamilySeedAddress(this.seed, curve);
});

Then('I should see family seed curve {string}', { timeout: 30 * 1000 }, async (curve) => {
    await dismissKeyboard();
    const value = element(by.id('keypair-curve-value'));
    await waitFor(value).toExist().withTimeout(15000);
    await waitFor(value).toHaveText(curve).withTimeout(20000);
});

Then('I choose family seed curve {string}', async (curve) => {
    await dismissKeyboard();
    await device.disableSynchronization();

    try {
        await element(by.id('keypair-curve-row')).tap({ x: 12, y: 12 });
    } catch (e) {
        await element(by.id('keypair-curve-row')).tap();
    }
    await sleepMs(800);

    const label = curve === 'secp256k1' ? 'secp256k1 (Default)' : curve;
    try {
        await element(by.id(`${curve}-item`)).tap({ x: 24, y: 16 });
    } catch (e) {
        try {
            await element(by.text(label)).tap();
        } catch (e2) {
            await element(by.id(`${curve}-item`)).tap();
        }
    }

    const deadline = Date.now() + 15000;
    let lastErr;
    while (Date.now() < deadline) {
        try {
            const attrs = await element(by.id('keypair-curve-value')).getAttributes();
            const text = attrs.text || attrs.label || '';
            if (String(text).indexOf(curve) !== -1) {
                return;
            }
            lastErr = new Error(`curve value ${JSON.stringify(text)}`);
        } catch (e) {
            lastErr = e;
        }
        await sleepMs(400);
    }
    throw lastErr || new Error(`did not select family seed curve ${curve}`);
});

Then('I should confirm expected family seed address', async () => {
    const expected = this.expectedFamilySeedAddress;
    await waitFor(element(by.id('account-import-show-address-view')))
        .toExist()
        .withTimeout(20000);
    const attributes = await element(by.id('account-address-text')).getAttributes();
    this.address = attributes.text;
    assert.equal(this.address, expected);
});

Then('I activate expected family seed address', { timeout: 5 * 60 * 1000 }, async () => {
    await activateAccount(this.expectedFamilySeedAddress);
});

Then('I use the xahau testnet ed25519 family seed', async () => {
    this.seed = SAMPLE_FAMILY_SEED_ED_XAHAU;
    this.expectedFamilySeedAddress = SAMPLE_FAMILY_SEED_ED_ADDRESS;
    this.expectedFamilySeedSecpAddress = SAMPLE_FAMILY_SEED_SECP_ADDRESS;
});

Then('I should see the family seed different curve prompt', { timeout: 30 * 1000 }, async () => {
    if (device.getPlatform() === 'android') {
        await waitForAndroidAlertText('ed25519', device.id);
        return;
    }
    await waitFor(element(by.label('Different curve')))
        .toExist()
        .withTimeout(20000);
    await waitFor(element(by.label('ed25519 rN1SEY…').and(by.type('_UIAlertControllerActionView'))))
        .toExist()
        .withTimeout(5000);
    await waitFor(element(by.label('secp256k1 rE1b4i…').and(by.type('_UIAlertControllerActionView'))))
        .toExist()
        .withTimeout(5000);
});

Then('I open the mnemonic import screen', async () => {
    await tapUntilScreen('tab-Settings', 'settings-tab-screen');
    await tapUntilScreen('accounts-button', 'accounts-list-screen');
    await tapUntilScreen('add-account-button', 'account-add-screen');
    await tapUntilScreen('account-import-button', 'account-import-access-level-view');
    await tapUntilScreen('next-button', 'account-import-secret-type-view');
    await tapTestId('mnemonic-radio-button');
    await tapUntilScreen('next-button', 'account-import-mnemonic-alert-view');
    await tapUntilScreen('next-button', 'account-import-enter-mnemonic-view');
});

Then('I use the sample 24-word mnemonic', async () => {
    this.mnemonic = SAMPLE_24_WORD_MNEMONIC.split(' ');
});

Then('I choose mnemonic curve {string}', async (curve) => {
    const id = curve === 'ed25519' ? 'curve-ed25519-button' : 'curve-secp256k1-button';
    const btn = element(by.id(id));
    const scroller = element(by.id('mnemonic-words-scroll'));
    for (let attempt = 0; attempt < 8; attempt++) {
        try {
            await waitFor(btn).toBeVisible().withTimeout(800);
            break;
        } catch (e) {
            try {
                await scroller.swipe('up', 'slow', 0.45);
            } catch (swipeErr) {
                // already at edge
            }
        }
    }
    try {
        await waitFor(btn).toBeVisible().withTimeout(2500);
    } catch (e) {
        await waitFor(btn).toExist().withTimeout(4000);
    }
    try {
        await btn.tap();
    } catch (e) {
        await btn.tap({ x: 12, y: 12 });
    }
    await sleepMs(350);
    try {
        await btn.tap();
    } catch (e) {
        await btn.tap({ x: 12, y: 12 });
    }
    await sleepMs(200);
});

Then('I reveal mnemonic import options', async () => {
    await dismissKeyboard();
    const scroller = element(by.id('mnemonic-words-scroll'));
    const sw = element(by.id('choose-curve-switch'));
    for (let i = 0; i < 12; i += 1) {
        try {
            await waitFor(sw).toBeVisible().withTimeout(800);
            return;
        } catch (e) {
            try {
                await scroller.swipe('up', 'slow', 0.7);
            } catch (swipeErr) {
                // already at edge
            }
        }
    }
    await waitFor(sw).toBeVisible().withTimeout(5000);
});

Then('I remember mnemonic address for curve {string}', async (curve) => {
    this.expectedMnemonicAddress = deriveMnemonicAddress(this.mnemonic, curve);
    if (Array.isArray(this.mnemonic) && this.mnemonic.join(' ') === SAMPLE_24_WORD_MNEMONIC) {
        const expected =
            curve === 'ed25519' ? 'r4wtygUBUyzLiibEwwKsA1YA9CKoWjUujS' : 'r9w2RvKA6rYyBsN3WWFBuEKB7XM83jVqbU';
        assert.equal(this.expectedMnemonicAddress, expected);
    }
});

Then('I should see expected mnemonic address', async () => {
    if (device.getPlatform() === 'android') {
        await waitUntilAndroidTestId('account-address-text', 15000);
        this.address = await androidReadTextByTestId('account-address-text');
    } else {
        const attributes = await element(by.id('account-address-text')).getAttributes();
        this.address = attributes.text;
    }
    assert.equal(this.address, this.expectedMnemonicAddress);
});

Then('I should see both mnemonic curves activated prompt', async () => {
    if (device.getPlatform() === 'android') {
        await waitForAndroidAlertText('secp256k1', device.id);
        return;
    }
    await waitFor(element(by.label('secp256k1 r9w2Rv…')))
        .toExist()
        .withTimeout(20000);
    await waitFor(element(by.label('ed25519 r4wtyg…')))
        .toExist()
        .withTimeout(5000);
});

Then('I should confirm expected mnemonic address', async () => {
    const expected = this.expectedMnemonicAddress;
    try {
        if (device.getPlatform() === 'android') {
            await waitUntilAndroidTestId('account-address-text', 20000);
        } else {
            await waitFor(element(by.id('account-import-show-address-view')))
                .toExist()
                .withTimeout(20000);
        }
    } catch (e) {
        if (device.getPlatform() === 'android') {
            await waitForAndroidAlertText(expected, device.id);
            return;
        }
        await waitFor(element(by.label(expected)))
            .toExist()
            .withTimeout(8000);
        return;
    }

    if (device.getPlatform() === 'android') {
        this.address = await androidReadTextByTestId('account-address-text');
    } else {
        const attributes = await element(by.id('account-address-text')).getAttributes();
        this.address = attributes.text;
    }
    assert.equal(this.address, expected);
});

Then('I activate expected mnemonic address', { timeout: 5 * 60 * 1000 }, async () => {
    await activateAccount(this.expectedMnemonicAddress);
});

Then('I enter my mnemonic', { timeout: 3 * 60 * 1000 }, async () => {
    const words = this.mnemonic;
    if (!Array.isArray(words) || words.length < 12) {
        throw new Error(`mnemonic not ready: ${JSON.stringify(words)}`);
    }

    // typeText + return advances to the next word field on iOS. Android
    // later rows are under 75% visible. Do not tap (IME covers the list).
    if (device.getPlatform() === 'android') {
        for (let i = 0; i < words.length; i++) {
            const serial = process.env.ANDROID_SERIAL || 'emulator-5554';
            if (i === 0) {
                await waitUntilAndroidTestId('word-0-input', 10000);
                await clickByTestId('word-0-input');
            }
            androidTypeText(words[i]);
            execFileSync('adb', ['-s', serial, 'shell', 'input', 'keyevent', '66'], { timeout: 3000 });
            await new Promise((resolve) => { setTimeout(resolve, 250); });
        }
        return;
    }

    const scroller = element(by.id('mnemonic-words-scroll'));
    try {
        await scroller.scrollTo('top');
    } catch (e) {
        // already at top
    }

    for (let i = 0; i < words.length; i++) {
        const field = element(by.id(`word-${i}-input`));
        await waitFor(field).toExist().withTimeout(8000);
        if (i > 2) {
            await dismissKeyboard();
            try {
                await waitFor(field)
                    .toBeVisible()
                    .whileElement(by.id('mnemonic-words-scroll'))
                    .scroll(70, 'down');
            } catch (e) {
                // already visible or at edge
            }
        }
        try {
            await field.tap();
            await field.replaceText(words[i]);
        } catch (e) {
            await dismissKeyboard();
            try {
                await scroller.scroll(70, 'down');
            } catch (scrollErr) {
                // at edge
            }
            await field.tap();
            await field.replaceText(words[i]);
        }
    }
    await dismissKeyboard();
});

Then('I tap my account in the list', async () => {
    const rowId = `account-${this.address}`;
    const row = element(by.id(rowId)).atIndex(0);
    const list = element(by.id('account-list-scroll'));

    if (device.getPlatform() === 'android') {
        if (!this.address) {
            const acc = await generateTestnetAccount();
            this.address = acc.address;
            this.seed = acc.secret;
        }
        await clickAndroidAccountRow(this.address, 'I-ReadOnly');
        return;
    }

    // Detox list.scroll() starts at the bottom edge. The tab bar swallows it
    // so the list does not move (I-ReadOnly stays below the fold). Swipe from
    // the middle of the list instead.
    // Edit Button + inner native control share account-{address} (multiple match).
    for (let i = 0; i < 12; i += 1) {
        try {
            await waitFor(row).toBeVisible().withTimeout(400);
            break;
        } catch (e) {
            try {
                await list.swipe('up', 'slow', 0.55);
            } catch (scrollErr) {
                break;
            }
            await new Promise((resolve) => {
                setTimeout(resolve, 500);
            });
        }
    }

    try {
        await row.tap();
    } catch (e) {
        await row.tap({ x: 24, y: 24 });
    }
});
