const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const resolveSerial = (serial) => process.env.ANDROID_SERIAL || serial || 'emulator-5554';

const logLine = (msg) => {
    const line = `[androidAlert ${new Date().toISOString()}] ${msg}`;
    console.error(line);
    try {
        const dir = process.env.TMPDIR || os.tmpdir();
        const logFile = `${dir.replace(/\/$/, '')}/alert-taps.log`;
        fs.appendFileSync(logFile, `${line}\n`);
    } catch (e) {
        // logging must never break the step
    }
};

// Verification that does not depend on UiAutomation (uiautomator dumps get
// SIGKILLed under load). A native AlertDialog is a separate window, so the
// app's window count rises above the 1-window baseline while one is open.
const appWindowCount = (serial) => {
    try {
        const out = execFileSync('adb', ['-s', serial, 'shell', 'dumpsys', 'window', 'windows'], {
            encoding: 'utf8',
            timeout: 8000,
        });
        // dumpsys window entries are indented ("  Window #N Window{...}"), so
        // no ^ anchor; '.' never crosses newlines so each entry counts once.
        const matches = out.match(/Window #\d+ .*com\.xrpllabs\.xumm/g);
        return matches ? matches.length : -1;
    } catch (e) {
        return -1;
    }
};

// Window-count based: never touches UiAutomation (see waitForAndroidAlertText
// for why raw uiautomator dumps must stay out of the suite).
const alertGone = (serial) => {
    const count = appWindowCount(serial);
    if (count >= 2) {
        return false;
    }
    if (count === 1) {
        return true;
    }
    return null; // dumpsys flaky: unknown
};

const tapAndroidAlertButton = async (label, serial, click) => {
    const adbSerial = resolveSerial(serial);
    await sleep(600);
    const performTap = async (x, y) => {
        if (typeof click === 'function') {
            try {
                await click(x, y);
                await sleep(400);
                return;
            } catch (e) {
                // Detox's own UiAutomation can be dead under load (the same
                // failure that kills uiautomator dumps). Raw `adb input tap`
                // goes through the InputManager instead and still works.
                logLine(`detox click failed (${String((e && e.message) || e).slice(0, 100)}), falling back to adb input tap at (${x},${y})`);
            }
        }
        try {
            execFileSync('adb', ['-s', adbSerial, 'shell', 'input', 'tap', String(x), String(y)], {
                timeout: 8000,
            });
        } catch (e) {
            logLine(`adb input tap at (${x},${y}) failed: ${String((e && e.message) || e).slice(0, 120)}`);
        }
        await sleep(400);
    };

    // No dump-based geometry lookup anywhere in the tap path: a standalone
    // `uiautomator dump` steals the single system UiAutomation slot and
    // disconnects the Detox agent's own connection. The agent normally
    // re-acquires it on its next command, but a pending screenshot frame
    // callback (DeviceCapture.takeScreenshotOnNextFrame) can fire first and
    // crash the app process with IllegalStateException (run23, 04:26).
    //
    // A coordinate sweep guarded by the
    // app window count (a native AlertDialog is a separate window, so the
    // count is 1 without a dialog and 2 with one). The dialog is vertically
    // centered and grows ~147px per message line, so the button-row center
    // moves ~73px per added line: 1 line 1075 (measured
    // state.xml [686,1012][978,1138]), 3 lines 1222 (measured
    // state2.xml [686,1159][978,1285]), others interpolated. Button height
    // 126 -> ~21px max gap between consecutive targets; 0-5 line messages
    // are all covered.
    const x = label === 'Cancel' ? 585 : 832;
    // Tall downgrade copy sits lower than the 1-line dialog. ENTER after the
    // sweep can hit Cancel and leave Access level on Full with no pin pad.
    const ys = [925, 1000, 1075, 1148, 1222, 1295, 1369, 1443, 1516, 1590];
    logLine(`label=${JSON.stringify(label)} guarded sweep x=${x}`);
    let count = appWindowCount(adbSerial);
    logLine(`pre-sweep window count: ${count}`);
    if (count === 1) {
        logLine('no dialog window detected, skipping sweep');
        return;
    }
    for (let i = 0; i < ys.length; i += 1) {
        if (count < 1) {
            logLine(`window count unknown before tap ${i + 1}, proceeding anyway (dumpsys flaky)`);
        }
        await performTap(x, ys[i]);
        const next = appWindowCount(adbSerial);
        logLine(`tapped (${x},${ys[i]}): window count ${count} -> ${next}`);
        if (next === 1) {
            logLine('dialog gone after sweep tap');
            return;
        }
        if (next < 1) {
            logLine('window count unknown after sweep tap, stopping to avoid misfire');
            return;
        }
        count = next;
        await sleep(400);
    }
    // Do not send ENTER for Yes/OK. On a tall dialog ENTER can activate
    // Cancel and leave the account on Full access with no pin pad.
    if (label === 'Cancel') {
        for (const code of [23, 66]) {
            try {
                execFileSync('adb', ['-s', adbSerial, 'shell', 'input', 'keyevent', String(code)], {
                    timeout: 5000,
                });
            } catch (e) {
                logLine(`keyevent ${code} failed: ${String((e && e.message) || e).slice(0, 120)}`);
            }
            await sleep(800);
            const gone = alertGone(adbSerial);
            logLine(`keyevent ${code}: dialog ${gone === true ? 'GONE' : gone === false ? 'still present' : 'unknown'}`);
            if (gone !== false) {
                return;
            }
        }
    }
    logLine(`fallback exhausted for label=${JSON.stringify(label)}`);
};

const waitForAndroidAlertText = async (title, serial) => {
    const adbSerial = resolveSerial(serial);
    // NOTE: this function is named for its original contract (verify alert
    // content), but it deliberately does NOT run `uiautomator dump` anymore.
    // A standalone uiautomator client steals the single system UiAutomation
    // slot, which disconnects the Detox agent's own connection. The agent
    // normally re-acquires it on its next command, but a pending screenshot
    // frame callback (DeviceCapture.takeScreenshotOnNextFrame) can fire first
    // and crash the app process with IllegalStateException("UiAutomation not
    // connected!") - observed as a hard app crash in run23 (04:26). Raw dumps
    // also never yielded usable geometry in-suite (fail fast under load, or
    // capture the still-launching empty window), so the window count is the
    // presence check: a native AlertDialog is a separate window, so the app
    // window count rises from 1 to 2 while one is open. The 40s window covers
    // cold-launch scenarios where the dev bundle must reload from Metro and
    // /sign/<uuid> links that fetch the payload over the network first.
    const deadline = Date.now() + 40000;
    let lastCount = appWindowCount(adbSerial);
    logLine(`alert '${title.slice(0, 40)}' initial window count: ${lastCount}`);
    let iteration = 0;
    do {
        iteration += 1;
        const count = appWindowCount(adbSerial);
        if (count !== lastCount) {
            logLine(`alert '${title.slice(0, 40)}' iter ${iteration}: window count ${lastCount} -> ${count}`);
            lastCount = count;
        }
        if (count >= 2) {
            return;
        }
        await sleep(700);
    } while (Date.now() < deadline);
    throw new Error(
        `alert window did not appear for: ${title} (${iteration} iterations; last window count ${lastCount}; baseline 1 window, dialog raises it to 2)`,
    );
};

module.exports = { tapAndroidAlertButton, waitForAndroidAlertText };
