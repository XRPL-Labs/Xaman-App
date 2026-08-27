const { execSync, execFileSync, spawn, exec } = require('child_process');
const { existsSync, mkdirSync, unlinkSync, writeFileSync } = require('fs');
const path = require('path');

const ARTIFACTS_DIR = process.env.E2E_ARTIFACTS_DIR
    ? path.resolve(process.env.E2E_ARTIFACTS_DIR)
    : path.resolve(__dirname, '../artifacts');
const STEP_SHOT_DIR = path.join(ARTIFACTS_DIR, 'steps');

const SCREENSHOT_OPTIONS = {
    timeout: 2000,
    killSignal: 'SIGKILL',
    stdio: 'ignore',
};

let screenshotIndex = 0;
let stepIndex = 0;
let deviceUdid = 'booted';
let platform = 'ios';
const androidSerial = process.env.ANDROID_SERIAL || 'emulator-5554';

const setDeviceUdid = (udid) => {
    deviceUdid = udid;
};

const setScreenshotPlatform = (value) => {
    platform = value;
};

const sanitize = (value) =>
    String(value || 'step')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .slice(0, 80);

const nextStepIndex = () => {
    stepIndex += 1;
    return stepIndex;
};

const takeScreenshot = () => {
    if (!existsSync(ARTIFACTS_DIR)) {
        mkdirSync(ARTIFACTS_DIR);
    }
    const screenShotFileName = `${ARTIFACTS_DIR}/screenshot-${screenshotIndex++}.png`;
    try {
        execSync(`xcrun simctl io ${deviceUdid} screenshot ${screenShotFileName}`, SCREENSHOT_OPTIONS);
    } catch (error) {
        console.error('error');
    }
};

const takeNamedScreenshot = (label) => {
    if (!existsSync(STEP_SHOT_DIR)) {
        mkdirSync(STEP_SHOT_DIR, { recursive: true });
    }
    const file = path.join(
        STEP_SHOT_DIR,
        `${platform}-${String(stepIndex).padStart(4, '0')}-${sanitize(label)}.png`,
    );
    try {
        if (platform === 'android') {
            const png = execFileSync('adb', ['-s', androidSerial, 'exec-out', 'screencap', '-p'], {
                timeout: 8000,
                maxBuffer: 16 * 1024 * 1024,
            });
            writeFileSync(file, png);
        } else {
            execFileSync('xcrun', ['simctl', 'io', deviceUdid, 'screenshot', file], {
                timeout: 8000,
                stdio: 'ignore',
            });
        }
    } catch (error) {
        // keep the suite moving if a shot fails
    }
    return file;
};

const startRecordingVideo = () => {
    if (process.platform !== 'darwin') {
        return;
    }
    if (!existsSync(ARTIFACTS_DIR)) {
        mkdirSync(ARTIFACTS_DIR);
    }
    const recordingFileName = `${ARTIFACTS_DIR}/recording.mov`;

    if (existsSync(recordingFileName)) {
        unlinkSync(recordingFileName);
    }

    try {
        spawn('xcrun', ['simctl', 'io', deviceUdid, 'recordVideo', `${recordingFileName}`], {
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

module.exports = {
    setDeviceUdid,
    setScreenshotPlatform,
    nextStepIndex,
    takeScreenshot,
    takeNamedScreenshot,
    startRecordingVideo,
    stopRecordingVideo,
};
