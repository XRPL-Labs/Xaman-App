const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

const SCREENSHOT_OPTIONS = {
    timeout: 2000,
    killSignal: 'SIGKILL',
    stdio: 'ignore',
};

let screenshotIndex = 0;

const takeScreenshot = () => {
    if (!existsSync(SCREENSHOT_DIR)) {
        mkdirSync(SCREENSHOT_DIR);
    }
    const screenShotFileName = `${SCREENSHOT_DIR}/screenshot-${screenshotIndex++}.png`;
    try {
        execSync(`xcrun simctl io booted screenshot ${screenShotFileName}`, SCREENSHOT_OPTIONS);
    } catch (error) {
        console.error('error');
    }
};

module.exports = { takeScreenshot };
