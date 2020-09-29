const { execSync, spawn, exec } = require('child_process');
const { existsSync, mkdirSync, unlinkSync } = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');

const SCREENSHOT_OPTIONS = {
    timeout: 2000,
    killSignal: 'SIGKILL',
    stdio: 'ignore',
};

let screenshotIndex = 0;

const takeScreenshot = () => {
    if (!existsSync(ARTIFACTS_DIR)) {
        mkdirSync(ARTIFACTS_DIR);
    }
    const screenShotFileName = `${ARTIFACTS_DIR}/screenshot-${screenshotIndex++}.png`;
    try {
        execSync(`xcrun simctl io booted screenshot ${screenShotFileName}`, SCREENSHOT_OPTIONS);
    } catch (error) {
        console.error('error');
    }
};

const startRecordingVideo = () => {
    if (!existsSync(ARTIFACTS_DIR)) {
        mkdirSync(ARTIFACTS_DIR);
    }
    const recordingFileName = `${ARTIFACTS_DIR}/recording.mov`;

    if (existsSync(recordingFileName)) {
        unlinkSync(recordingFileName);
    }

    try {
        spawn('xcrun', ['simctl', 'io', 'booted', 'recordVideo', `${recordingFileName}`], {
            timeout: 30 * 60 * 1000,
            maxBuffer: 1024 * 20 * 100,
        });
    } catch (error) {
        console.error('error');
    }
};

const stopRecordingVideo = () => {
    exec('killall -SIGINT simctl', {
        timeout: 15 * 1000,
        maxBuffer: 1024 * 20 * 100,
    });
};

module.exports = { takeScreenshot, startRecordingVideo, stopRecordingVideo };
