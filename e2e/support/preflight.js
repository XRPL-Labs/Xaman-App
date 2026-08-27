const { execSync } = require('child_process');
const fetch = require('node-fetch');

// The suite exercises the real Xaman backend (device registration, ToS, curated assets)
// and the real Xahau testnet (faucet funding, on-ledger signing). Without these reachable
// the run WILL fail — check up front and fail with a clear message instead of cryptic
// element timeouts halfway through the suite.
const REQUIRED_ENDPOINTS = [
    ['Xaman backend', 'https://xaman.app/api/v1/app/ping'],
    ['Xahau testnet faucet/node', 'https://xahau-test.net'],
];

const checkNetwork = async () => {
    for (const [label, url] of REQUIRED_ENDPOINTS) {
        try {
            // any HTTP response (including 4xx) proves reachability
            await fetch(url, { timeout: 10000 });
        } catch (error) {
            throw new Error(
                `e2e preflight failed: cannot reach ${label} (${url}): ${error.message}\n` +
                    'The e2e suite drives the real Xaman backend and the real Xahau testnet, ' +
                    'so it needs a working internet connection to run.',
            );
        }
    }
};

// Create the dedicated local simulator if this machine does not have it yet,
// so a fresh checkout can run `make test-e2e` without manual simctl setup.
const E2E_SIMULATOR_NAME = 'Xaman-e2e';
const E2E_SIMULATOR_TYPE = 'iPhone 16 Pro';

const ensureLocalSimulator = () => {
    if (!String(process.env?.DETOX_CONFIGURATION || '').startsWith('ios.simulator.local')) {
        return;
    }

    const devices = execSync('xcrun simctl list devices available --json', { encoding: 'utf-8' });
    if (devices.includes(`"name" : "${E2E_SIMULATOR_NAME}"`) || devices.includes(`"name": "${E2E_SIMULATOR_NAME}"`)) {
        return;
    }

    // eslint-disable-next-line no-console
    console.log(`e2e preflight: creating missing "${E2E_SIMULATOR_NAME}" (${E2E_SIMULATOR_TYPE}) simulator`);
    execSync(`xcrun simctl create "${E2E_SIMULATOR_NAME}" "${E2E_SIMULATOR_TYPE}"`);
};

module.exports = { checkNetwork, ensureLocalSimulator };
