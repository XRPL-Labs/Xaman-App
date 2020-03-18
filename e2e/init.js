/* eslint-disable spellcheck/spell-checker */
/* eslint-disable func-names */
/* eslint-disable space-before-function-paren */

const detox = require('detox');
const adapter = require('detox/runners/mocha/adapter');
const config = require('../package.json').detox;

before(async () => {
    await detox.init(config, { launchApp: false, initGlobals: false });
    await detox.device.launchApp({ permissions: { notifications: 'YES', camera: 'YES' } });
});

beforeEach(async function() {
    await adapter.beforeEach(this);
});

afterEach(async function() {
    await adapter.afterEach(this);
});

after(async () => {
    await detox.cleanup();
});
