#!/usr/bin/env node
/**
 * Drive the already-running iOS Debug simulator by testID (same stack as Detox e2e).
 * Does not rebuild, reinstall, or launch a new app instance.
 *
 *   node scripts/ios-by-id.js tap start-button
 *   node scripts/ios-by-id.js tap scan-qr-button
 *   node scripts/ios-by-id.js tap 1-key
 *   node scripts/ios-by-id.js exists scan-modal
 *   node scripts/ios-by-id.js label "Use anyway"
 */
const detox = require('detox/internals');
const { element, by, waitFor } = require('detox');

const configuration = process.env.DETOX_CONFIGURATION || 'ios.simulator.dev+xaman.ios.debug';
const [cmd, target] = process.argv.slice(2);

const usage = () => {
    console.error('usage: node scripts/ios-by-id.js tap|exists|label <id-or-label>');
    process.exit(2);
};

if (!cmd || !target) {
    usage();
}

const run = async () => {
    await detox.init({
        argv: {
            configuration,
            reuse: true,
        },
    });

    if (cmd === 'tap') {
        await waitFor(element(by.id(target)))
            .toBeVisible()
            .withTimeout(8000);
        await element(by.id(target)).tap();
        return;
    }

    if (cmd === 'exists') {
        await waitFor(element(by.id(target)))
            .toExist()
            .withTimeout(8000);
        return;
    }

    if (cmd === 'label') {
        await waitFor(element(by.label(target)))
            .toBeVisible()
            .withTimeout(8000);
        await element(by.label(target)).tap();
        return;
    }

    usage();
};

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await detox.cleanup();
        } catch {
            // ignore
        }
    });
