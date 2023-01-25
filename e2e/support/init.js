const detox = require('detox/internals');

const { device } = require('detox');
const { Before, BeforeAll, AfterAll, After } = require('cucumber');
const adapter = require('./adapter');

const { startRecordingVideo, stopRecordingVideo } = require('../helpers/artifacts');
const { startDeviceLogStream } = require('../helpers/simulator');

BeforeAll(async () => {
    let configuration;

    const argv = process.argv.slice(2);
    argv.forEach((arg, index) => {
        if (arg === '--configuration') {
            configuration = argv[index + 1];
        }
    });

    const config = {
        configuration,
        reuse: false,
    };

    await detox.init({ argv: config });

    // start device log
    startDeviceLogStream();

    // start recording video
    startRecordingVideo();

    await device.launchApp({
        permissions: { notifications: 'YES', camera: 'YES' },
        disableTouchIndicators: false,
    });

    await device.setURLBlacklist(['.*xumm.app.*']);
});

Before(async (context) => {
    // await detox.device.reloadReactNative();
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
