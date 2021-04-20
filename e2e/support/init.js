const detox = require('detox');
const { Before, BeforeAll, AfterAll, After } = require('cucumber');
const config = require('../../package.json').detox;
const adapter = require('./adapter');

const { startRecordingVideo, stopRecordingVideo } = require('../helpers/artifacts');
const { startDeviceLogStream } = require('../helpers/simulator');

BeforeAll(async () => {
    await detox.init(config, { launchApp: false, reuse: false });

    // start device log
    startDeviceLogStream();

    // start recording video
    startRecordingVideo();

    await detox.device.launchApp({
        permissions: { notifications: 'YES', camera: 'YES' },
    });

    await detox.device.setURLBlacklist(['.*xumm.app.*']);
});

Before(async context => {
    // await detox.device.reloadReactNative();
    await adapter.beforeEach(context);
});

After(async context => {
    await adapter.afterEach(context);
});

AfterAll(async () => {
    // clean up
    await detox.cleanup();

    // stop recording
    stopRecordingVideo();
});
