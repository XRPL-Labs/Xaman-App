const detox = require('detox/internals');

const { device } = require('detox');
const { Before, BeforeAll, AfterAll, After } = require('@cucumber/cucumber');
const adapter = require('./adapter');

const { startRecordingVideo, stopRecordingVideo } = require('../helpers/artifacts');
const { startDeviceLogStream } = require('../helpers/simulator');

BeforeAll(async () => {
    await detox.init({
        argv: {
            reuse: false,
        },
    });

    // start device log
    startDeviceLogStream();

    // start recording video
    startRecordingVideo();

    await device.launchApp({
        newInstance: true,
        permissions: { notifications: 'YES', camera: 'YES' },
        disableTouchIndicators: false,
    });

    await device.setURLBlacklist(['.*xumm.app.*']);
});

Before(async (context) => {
    await adapter.beforeEach(context);
});

After(async (context) => {
    await adapter.afterEach(context);
});

AfterAll(async () => {
    // clean up
    await detox.cleanup();

    // stop recording
    stopRecordingVideo();
});
