const { execFileSync } = require('child_process');
const { element, by, waitFor, device } = require('detox');

const APP_ID = 'com.xrpllabs.xumm';
const DUMP_NAME = 'xaman-detox-ui.xml';

const DUMP_SPECS = [
    { abs: `/data/user/0/${APP_ID}/cache/${DUMP_NAME}`, pkg: APP_ID, rel: `cache/${DUMP_NAME}` },
    { abs: `/data/data/${APP_ID}/cache/${DUMP_NAME}`, pkg: APP_ID, rel: `cache/${DUMP_NAME}` },
];

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const androidSerial = () => process.env.ANDROID_SERIAL || device.id;

const adbOut = (args, timeout = 8000) =>
    execFileSync('adb', ['-s', androidSerial(), ...args], {
        encoding: 'utf8',
        timeout,
        maxBuffer: 12 * 1024 * 1024,
    });

let compressedOff = false;

const ensureUncompressedDump = async () => {
    if (compressedOff) {
        return;
    }
    try {
        await device.getUiDevice().setCompressedLayoutHeirarchy(false);
    } catch (e) {
        // already uncompressed / UiDevice not ready
    }
    // dumpWindowHierarchy(String) always waitForIdle() first. Changelog WebView
    // and RN Animated never go idle (~20s). Configurator timeout 0 dumps now.
    const driver = device.deviceDriver;
    if (driver && driver.invocationManager) {
        const classes = [
            'androidx.test.uiautomator.Configurator',
            'android.support.test.uiautomator.Configurator',
        ];
        const types = ['Integer', 'Long', 'long', 'integer'];
        let set = false;
        for (let c = 0; c < classes.length && !set; c += 1) {
            for (let t = 0; t < types.length && !set; t += 1) {
                try {
                    await driver.invocationManager.execute({
                        target: {
                            type: 'Invocation',
                            value: {
                                target: { type: 'Class', value: classes[c] },
                                method: 'getInstance',
                                args: [],
                            },
                        },
                        method: 'setWaitForIdleTimeout',
                        args: [{ type: types[t], value: 0 }],
                    });
                    set = true;
                    // eslint-disable-next-line no-console
                    console.error('[tapById] setWaitForIdleTimeout(0) via', classes[c], types[t]);
                } catch (e) {
                    // next type/class
                }
            }
        }
    }
    compressedOff = true;
};

const readDumpFile = (spec) => {
    const attempts = [
        ['exec-out', 'run-as', spec.pkg, 'cat', spec.rel],
        ['shell', 'run-as', spec.pkg, 'cat', spec.rel],
        ['exec-out', 'cat', spec.abs],
        ['shell', 'cat', spec.abs],
    ];
    for (let i = 0; i < attempts.length; i += 1) {
        try {
            const xml = adbOut(attempts[i]);
            // Truncated dumps still start with <hierarchy and systemui nodes.
            // PIN keys and testIDs sit later; require a closed document.
            if (xml && xml.indexOf('<hierarchy') !== -1 && xml.indexOf('</hierarchy>') !== -1) {
                return xml;
            }
        } catch (e) {
            // next reader
        }
    }
    return '';
};

/** When Detox UiAutomation hangs after ToS→Home, dump without it. */
const adbFallbackDump = () => {
    const paths = ['/sdcard/xaman-e2e-ui.xml', '/data/local/tmp/xaman-e2e-ui.xml'];
    for (let i = 0; i < paths.length; i += 1) {
        try {
            execFileSync('adb', ['-s', androidSerial(), 'shell', 'uiautomator', 'dump', paths[i]], {
                timeout: 8000,
            });
            const xml = adbOut(['exec-out', 'cat', paths[i]], 8000);
            if (xml && xml.indexOf('<hierarchy') !== -1) {
                return xml;
            }
        } catch (e) {
            const xml = String((e && e.stdout) || '');
            if (xml.indexOf('<hierarchy') !== -1) {
                return xml;
            }
        }
    }
    try {
        const xml = execFileSync(
            'adb',
            ['-s', androidSerial(), 'exec-out', 'uiautomator', 'dump', '/dev/tty'],
            { timeout: 8000, maxBuffer: 12 * 1024 * 1024, encoding: 'utf8' },
        );
        if (xml && xml.indexOf('<hierarchy') !== -1) {
            return xml;
        }
    } catch (e) {
        const xml = String((e && e.stdout) || '');
        if (xml.indexOf('<hierarchy') !== -1) {
            return xml;
        }
    }
    return '';
};

/**
 * Dump via Detox UiDevice (same UiAutomation as the agent). Do not call
 * `adb shell uiautomator dump` — that steals the one system UiAutomation
 * slot and disconnects Detox. Do not Promise.race a dump timeout: that
 * leaves the invoke pending and the next dump is "multiple interactions".
 * Write under the app cache: /data/local/tmp is not writable by the
 * instrumentation UID on API 36.
 */
let cachedXml = '';
let cachedAt = 0;
let dumpInFlight = null;
let lastTabXml = '';
// True only after Detox itself reports the session dead. Never auto-reset:
// retrying dumpWindowHierarchy while an invoke is pending wedges the agent.
let dumpBroken = false;

const xmlHasAppTabs = (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    return (
        blob.indexOf('bottom_navigation') !== -1 ||
        blob.indexOf('tab-settings') !== -1 ||
        (blob.indexOf('>settings<') !== -1 && blob.indexOf('>home<') !== -1) ||
        (blob.indexOf('text="settings"') !== -1 && blob.indexOf('text="home"') !== -1)
    );
};

const rememberDump = (xml) => {
    if (!xml) {
        return;
    }
    cachedXml = xml;
    cachedAt = Date.now();
    if (xmlHasAppTabs(xml)) {
        lastTabXml = xml;
    }
};

const detoxDisconnected = (err) => {
    const m = String((err && err.message) || err);
    return (
        m.indexOf("can't seem to connect") !== -1 ||
        m.indexOf('pending request') !== -1 ||
        m.indexOf('could not be delivered') !== -1 ||
        m.indexOf('unexpectedly disconnected') !== -1
    );
};

const readAnyDumpFile = () => {
    for (let i = 0; i < DUMP_SPECS.length; i += 1) {
        const xml = readDumpFile(DUMP_SPECS[i]);
        if (xml) {
            return xml;
        }
    }
    return '';
};

const androidDumpXml = async () => {
    if (cachedXml && Date.now() - cachedAt < 400) {
        return cachedXml;
    }
    // One Detox dumpWindowHierarchy at a time. Callers share the in-flight
    // promise instead of queueing a second invoke.
    if (dumpInFlight) {
        return dumpInFlight;
    }
    dumpInFlight = (async () => {
        if (cachedXml && Date.now() - cachedAt < 400) {
            return cachedXml;
        }
        if (dumpBroken) {
            return cachedXml || lastTabXml || '';
        }
        await ensureUncompressedDump();
        const ui = device.getUiDevice();
        const spec = DUMP_SPECS[0];
        const started = Date.now();
        try {
            await ui.dumpWindowHierarchy(spec.abs);
        } catch (e) {
            const msg = String((e && e.message) || e);
            // eslint-disable-next-line no-console
            console.error('[tapById] dumpWindowHierarchy failed:', spec.abs, msg.slice(0, 180));
            if (detoxDisconnected(e) || msg.indexOf('simultaneously') !== -1) {
                dumpBroken = true;
            }
        }
        // Invoke can return after waitForIdle while the file is still flushing.
        for (let r = 0; r < 16; r += 1) {
            const xml = readAnyDumpFile();
            if (xml) {
                rememberDump(xml);
                if (Date.now() - started > 2000) {
                    // eslint-disable-next-line no-console
                    console.error('[tapById] dump', Date.now() - started, 'ms', dumpSummary(xml).slice(0, 160));
                }
                return xml;
            }
            await sleep(80);
        }
        return cachedXml || lastTabXml || '';
    })().finally(() => {
        dumpInFlight = null;
    });
    return dumpInFlight;
};

const attrValue = (attrs, name) => {
    const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
    return m ? m[1] : '';
};

const resourceIdTail = (resourceId) => {
    const idx = resourceId.lastIndexOf(':id/');
    return idx >= 0 ? resourceId.slice(idx + 4) : resourceId;
};

const boundsFromAttrs = (attrs) => {
    const m = attrs.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!m) {
        return null;
    }
    const x1 = Number(m[1]);
    const y1 = Number(m[2]);
    const x2 = Number(m[3]);
    const y2 = Number(m[4]);
    if (x2 <= x1 || y2 <= y1) {
        return null;
    }
    return {
        x: Math.round((x1 + x2) / 2),
        y: Math.round((y1 + y2) / 2),
        x1,
        y1,
        x2,
        y2,
    };
};

const dumpHasRnContent = (xml) => {
    if (!xml || xml.indexOf('</hierarchy>') === -1) {
        return false;
    }
    // Native Metro splash is still com.xrpllabs.xumm — require RN testIDs.
    return (
        xml.indexOf('lock-overlay') !== -1 ||
        xml.indexOf('virtual-keyboard') !== -1 ||
        xml.indexOf('1-key') !== -1 ||
        xml.indexOf('home-tab') !== -1 ||
        xml.indexOf('settings-tab') !== -1 ||
        xml.indexOf('start-button') !== -1 ||
        xml.indexOf('onboarding') !== -1 ||
        xml.indexOf('pin-code') !== -1 ||
        xml.indexOf('account-') !== -1
    );
};

const dumpHasAppContent = (xml) => {
    if (!xml || xml.indexOf('</hierarchy>') === -1) {
        return false;
    }
    if (dumpHasRnContent(xml)) {
        return true;
    }
    const pkgHits = xml.match(/package="com\.xrpllabs\.xumm"/g);
    return !!(pkgHits && pkgHits.length > 2);
};

/** launchApp(sync 0) returns on native splash; wait until JS mounted. */
const waitUntilAndroidRnReady = async (timeoutMs = 120000) => {
    if (device.getPlatform() !== 'android') {
        return;
    }
    const deadline = Date.now() + timeoutMs;
    let lastXml = '';
    while (Date.now() < deadline) {
        cachedXml = '';
        cachedAt = 0;
        lastXml = await androidDumpXml();
        if (dumpHasRnContent(lastXml)) {
            return;
        }
        await sleep(800);
    }
    throw new Error(`android RN UI not ready after launch (${dumpSummary(lastXml)})`);
};

const aliasesForTestId = (testId) => {
    const aliases = [testId];
    if (testId.indexOf('tab-') === 0) {
        const name = testId.slice(4);
        aliases.push(name, name.toLowerCase());
        if (name === 'XApps') {
            aliases.push('xApps', 'xapps');
        }
    }
    if (testId === 'close-change-log-button') {
        aliases.push('Close', 'close');
    }
    // Footer testIDs are often missing from the dump; the visible label is not.
    if (testId === 'next-button') {
        aliases.push('Next', 'Done');
    }
    if (testId === 'finish-button') {
        aliases.push('Finish');
    }
    if (testId === 'save-button') {
        aliases.push('Save');
    }
    if (testId === 'back-button') {
        aliases.push('Back', 'Previous');
    }
    if (/^\d-key$/.test(testId)) {
        aliases.push(testId[0]);
    }
    return aliases;
};

const nodeHaystack = (attrs) => {
    const resourceId = attrValue(attrs, 'resource-id');
    return [
        resourceIdTail(resourceId),
        resourceId,
        attrValue(attrs, 'content-desc'),
        attrValue(attrs, 'text'),
    ];
};

const nodeMatchesTestId = (attrs, testId) => {
    const aliases = aliasesForTestId(testId);
    const values = nodeHaystack(attrs);
    for (let i = 0; i < aliases.length; i += 1) {
        const alias = aliases[i];
        for (let j = 0; j < values.length; j += 1) {
            if (values[j] && values[j].toLowerCase() === alias.toLowerCase()) {
                return true;
            }
        }
    }
    return false;
};

const parseNodes = (xml) => {
    const nodes = [];
    const nodeRe = /<node\b([^>]*)\/?>/g;
    let m = nodeRe.exec(xml);
    while (m) {
        const attrs = m[1];
        const bounds = boundsFromAttrs(attrs);
        if (bounds) {
            nodes.push({
                attrs,
                bounds,
                clickable: attrValue(attrs, 'clickable') === 'true',
                enabled: attrValue(attrs, 'enabled') !== 'false',
                text: attrValue(attrs, 'text'),
                contentDesc: attrValue(attrs, 'content-desc'),
                resourceId: attrValue(attrs, 'resource-id'),
                package: attrValue(attrs, 'package'),
            });
        }
        m = nodeRe.exec(xml);
    }
    return nodes;
};

const isSystemUiNode = (node) => {
    const pkg = node.package || '';
    const id = node.resourceId || '';
    return (
        pkg === 'com.android.systemui' ||
        pkg.indexOf('systemui') !== -1 ||
        id.indexOf('navigationbar') !== -1 ||
        id.indexOf('navigationBar') !== -1 ||
        id.indexOf('nav_bar') !== -1
    );
};

const pickNodeForTestId = (xml, testId) => {
    if (!xml) {
        return null;
    }
    const nodes = parseNodes(xml).filter((node) => !isSystemUiNode(node));
    const matches = nodes.filter((node) => nodeMatchesTestId(node.attrs, testId));
    // Digit aliases include bare "9". Prefer the real `${n}-key` node so a
    // missed 6th PIN tap is not a click on some other "9" in the dump.
    if (/^\d-key$/.test(testId)) {
        const exact = matches.filter((node) => {
            const tail = resourceIdTail(node.resourceId);
            const desc = node.contentDesc || '';
            return tail === testId || desc === testId;
        });
        if (exact.length) {
            return exact.find((node) => node.clickable) || exact[0];
        }
    }
    const clickable = matches.filter((node) => node.clickable);
    const pool = clickable.length ? clickable : matches;
    if (!pool.length) {
        return null;
    }
    return pool.reduce((best, node) => {
        const area = (node.bounds.x2 - node.bounds.x1) * (node.bounds.y2 - node.bounds.y1);
        const bestArea = (best.bounds.x2 - best.bounds.x1) * (best.bounds.y2 - best.bounds.y1);
        return area < bestArea ? node : best;
    });
};

const androidBoundsByTestId = async (testId) => {
    const xml = await androidDumpXml();
    const pick = pickNodeForTestId(xml, testId);
    return pick ? pick.bounds : null;
};

const androidReadTextByTestId = async (testId) => {
    const xml = await androidDumpXml();
    const pick = pickNodeForTestId(xml, testId);
    if (!pick) {
        return null;
    }
    if (pick.text || pick.contentDesc) {
        return pick.text || pick.contentDesc;
    }
    const nodes = parseNodes(xml);
    const parts = [];
    for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        if (
            n.text &&
            n.bounds.x1 >= pick.bounds.x1 &&
            n.bounds.x2 <= pick.bounds.x2 &&
            n.bounds.y1 >= pick.bounds.y1 &&
            n.bounds.y2 <= pick.bounds.y2
        ) {
            parts.push(n.text);
        }
    }
    return parts.join(' ') || null;
};

const dumpSummary = (xml) => {
    if (!xml) {
        return 'no-xml';
    }
    if (xml.indexOf('</hierarchy>') === -1) {
        return `truncated nodes=${parseNodes(xml).length}`;
    }
    const labels = [];
    const nodes = parseNodes(xml);
    for (let i = 0; i < nodes.length; i += 1) {
        const label = nodes[i].resourceId || nodes[i].contentDesc || nodes[i].text;
        if (!label) {
            continue;
        }
        if (label.indexOf('com.android.systemui') === 0 || label.indexOf('status_bar') !== -1) {
            continue;
        }
        if (labels.indexOf(label) === -1) {
            labels.push(label);
        }
        if (labels.length >= 25) {
            break;
        }
    }
    return labels.join('|') || `nodes=${nodes.length}`;
};

let keypadBounds = null;
let keypadAt = 0;

const adbTap = (x, y) => {
    execFileSync('adb', ['-s', androidSerial(), 'shell', 'input', 'tap', String(x), String(y)], {
        timeout: 3000,
    });
};

const tapBounds = async (bounds) => {
    if (!bounds) {
        return;
    }
    // InputManager tap. UiDevice.click waits for accessibility idle (changelog
    // WebView / RN Animated) and is the same slot as dumpWindowHierarchy.
    adbTap(bounds.x, bounds.y);
    cachedXml = '';
    cachedAt = 0;
};

const pressAndroidBack = () => {
    try {
        execFileSync('adb', ['-s', androidSerial(), 'shell', 'input', 'keyevent', '4'], { timeout: 4000 });
    } catch (e) {
        // no activity
    }
};

const adbTapChangelogClose = async () => {
    cachedXml = '';
    cachedAt = 0;
    const xml = await androidDumpXml();
    const close =
        pickNodeForTestId(xml, 'close-change-log-button') ||
        parseNodes(xml).find((n) => {
            const t = `${n.text || ''} ${n.contentDesc || ''}`.trim().toLowerCase();
            return t === 'close';
        });
    if (!close) {
        return false;
    }
    await tapBounds(close.bounds);
    return true;
};

const keypadFromXml = (xml) => {
    const pad = {};
    if (!xml) {
        return pad;
    }
    for (let d = 0; d <= 9; d += 1) {
        const pick = pickNodeForTestId(xml, `${d}-key`);
        if (pick) {
            pad[String(d)] = pick.bounds;
        }
    }
    const back = pickNodeForTestId(xml, 'x-key');
    if (back) {
        pad.x = back.bounds;
    }
    return pad;
};

const refreshKeypadBounds = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        cachedXml = '';
        cachedAt = 0;
        const xml = await androidDumpXml();
        const pad = keypadFromXml(xml);
        if (Object.keys(pad).filter((k) => k !== 'x').length >= 10) {
            keypadBounds = pad;
            keypadAt = Date.now();
            return pad;
        }
        await sleep(200);
    }
    throw new Error(`passcode keypad missing from hierarchy (${dumpSummary(cachedXml)})`);
};

const clearAndroidPasscodePad = async () => {
    cachedXml = '';
    cachedAt = 0;
    const xml = await androidDumpXml();
    const back = pickNodeForTestId(xml, 'x-key') || (keypadBounds && keypadBounds.x ? { bounds: keypadBounds.x } : null);
    if (!back) {
        return;
    }
    const bounds = back.bounds || back;
    for (let i = 0; i < 8; i += 1) {
        await tapBounds(bounds);
        await sleep(80);
    }
};

const enterAndroidPasscode = async (code) => {
    const digits = String(code).split('');
    for (let attempt = 0; attempt < 3; attempt += 1) {
        // Always clear first. 5/6 dots after resume + a second entry is Invalid.
        await clearAndroidPasscodePad();
        await sleep(attempt === 0 ? 250 : 500);
        if (!(dumpBroken && keypadBounds && Object.keys(keypadBounds).length >= 10)) {
            keypadBounds = null;
            keypadAt = 0;
        }
        let pad = {};
        try {
            pad = await refreshKeypadBounds();
        } catch (e) {
            pad = keypadBounds || {};
        }
        for (let i = 0; i < digits.length; i += 1) {
            const bounds = pad[digits[i]];
            if (!bounds) {
                throw new Error(`passcode key ${digits[i]}-key missing from hierarchy (${dumpSummary(cachedXml)})`);
            }
            await tapBounds(bounds);
            await sleep(280);
        }
        let retryInvalid = false;
        const goneBy = Date.now() + 4000;
        while (Date.now() < goneBy) {
            cachedXml = '';
            cachedAt = 0;
            const xml = await androidDumpXml();
            if (!xml || !dumpHasAppContent(xml)) {
                await sleep(250);
                continue;
            }
            if (xml.toLowerCase().indexOf('invalid') !== -1) {
                retryInvalid = true;
                await sleep(800);
                break;
            }
            // Unlock pad still up = missed digit. Setup/confirm PIN has no lock-overlay.
            if (xmlHasLockOverlay(xml) && pickNodeForTestId(xml, '1-key')) {
                await sleep(250);
                continue;
            }
            return;
        }
        if (retryInvalid || (attempt < 2)) {
            continue;
        }
    }
    throw new Error('passcode did not dismiss lock-overlay');
};

/**
 * Tap a control by testID. Android uses UiDevice hierarchy (no Espresso idle).
 * Digit keys share one keypad dump so PIN entry is not one dump per digit.
 *
 * Never click displayHeight fractions. On 3-button Samsung that is the OS
 * Recents/Home/Back bar (LaunchActivity does not pad those bars). Resolve
 * tabs and footers from the Xaman window dump.
 */
const TAB_LABELS = {
    'tab-Home': ['Home'],
    'tab-Events': ['Events'],
    'tab-XApps': ['xApps', 'XApps', 'xapps'],
    'tab-Settings': ['Settings'],
};

const TAB_SLOT = {
    'tab-Home': 0,
    'tab-Events': 1,
    'tab-XApps': 3,
    'tab-Settings': 4,
};
const TAB_SLOT_COUNT = 5;

let lastStatusBarCollapse = 0;

const collapseAndroidStatusBar = async (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    if (
        blob.indexOf('google play services notification') === -1 &&
        blob.indexOf('expandablenotificationrow') === -1 &&
        blob.indexOf('status_bar_latest_event_content') === -1 &&
        blob.indexOf('notification:') === -1
    ) {
        return false;
    }
    if (Date.now() - lastStatusBarCollapse < 1500) {
        return false;
    }
    lastStatusBarCollapse = Date.now();
    try {
        execFileSync('adb', ['-s', androidSerial(), 'shell', 'cmd', 'statusbar', 'collapse'], { timeout: 3000 });
    } catch (e) {
        try {
            execFileSync('adb', ['-s', androidSerial(), 'shell', 'service', 'call', 'statusbar', '2'], { timeout: 3000 });
        } catch (e2) {
            // no status bar service
        }
    }
    cachedXml = '';
    cachedAt = 0;
    return true;
};

const nodePlainLabel = (node) => {
    const text = (node.text || '').trim();
    if (text) {
        return text;
    }
    return (node.contentDesc || '').trim();
};

const androidClearBlockingUi = async () => {
    try {
        execFileSync('adb', ['-s', androidSerial(), 'shell', 'input', 'keyevent', '66'], {
            timeout: 3000,
        });
    } catch (e) {
        // no alert
    }
    cachedXml = '';
    cachedAt = 0;
    const xml = await androidDumpXml();
    await clickDumpLabel(xml, 'Close');
    await clickDumpLabel(xml, 'OK');
    if (xmlHasLockOverlay(xml) && pickNodeForTestId(xml, '1-key')) {
        await enterAndroidPasscode(E2E_PASSCODE);
    }
};

const xummContentBottom = (nodes) => {
    const roots = nodes.filter(
        (n) =>
            (n.resourceId || '').indexOf('action_bar_root') !== -1 ||
            (n.resourceId || '').indexOf(':id/content') !== -1,
    );
    if (!roots.length) {
        return 0;
    }
    return roots.reduce((best, n) => (n.bounds.y2 > best.bounds.y2 ? n : best)).bounds.y2;
};

// Samsung 3-button Home/Back sit just below the Xaman window (y=2131 on M21).
const clampClickY = (bounds, nodes) => {
    let y = Math.round(bounds.y1 + Math.max(8, (bounds.y2 - bounds.y1) * 0.3));
    const bottom = xummContentBottom(nodes);
    if (bottom && y > bottom - 24) {
        y = Math.max(bounds.y1 + 4, bottom - 24);
    }
    return y;
};

const tabClickBounds = (bounds, nodes) => ({
    ...bounds,
    y: clampClickY(bounds, nodes || []),
});

const pickTabBarContainer = (nodes) => {
    // RNN `bottomTabs` is the whole window. Only the short nav strip is the bar.
    const strip = (n) => {
        const h = n.bounds.y2 - n.bounds.y1;
        const w = n.bounds.x2 - n.bounds.x1;
        return h >= 40 && h <= 280 && w >= 200;
    };
    const byId = (needles) =>
        nodes.filter((n) => !isSystemUiNode(n) && strip(n) && needles.some((s) => (n.resourceId || '').indexOf(s) !== -1));
    const containers = byId(['bottom_navigation_container']);
    const bars = containers.length ? containers : byId(['bottomTabs', 'bottom_navigation']);
    if (!bars.length) {
        return null;
    }
    return bars.reduce((best, n) => (n.bounds.y1 >= best.bounds.y1 ? n : best));
};

const pickTabNode = (xml, testId) => {
    const labels = TAB_LABELS[testId];
    if (!labels) {
        return pickNodeForTestId(xml, testId);
    }
    const nodes = parseNodes(xml).filter((n) => !isSystemUiNode(n));
    const want = labels.map((label) => label.toLowerCase());
    const labelHits = nodes.filter((n) => want.indexOf(nodePlainLabel(n).toLowerCase()) !== -1);
    if (labelHits.length) {
        const lowest = labelHits.reduce((best, n) => (n.bounds.y1 > best.bounds.y1 ? n : best));
        const item = nodes.find(
            (n) =>
                n.clickable &&
                n.bounds.x1 <= lowest.bounds.x1 &&
                n.bounds.x2 >= lowest.bounds.x2 &&
                n.bounds.y1 <= lowest.bounds.y1 &&
                n.bounds.y2 >= lowest.bounds.y2 &&
                n.bounds.y2 - n.bounds.y1 <= 280 &&
                n.bounds.x2 - n.bounds.x1 <= 420,
        );
        // Prefer the label itself. A full-width tab bar click hits OS Home.
        const hit = item && item.bounds.x2 - item.bounds.x1 <= 420 ? item : lowest;
        return { ...hit, bounds: tabClickBounds(hit.bounds, nodes) };
    }
    const byId = pickNodeForTestId(xml, testId);
    if (byId && byId.bounds.y2 - byId.bounds.y1 <= 280 && byId.bounds.x2 - byId.bounds.x1 <= 420) {
        return { ...byId, bounds: tabClickBounds(byId.bounds, nodes) };
    }
    const bar = pickTabBarContainer(nodes);
    if (!bar || TAB_SLOT[testId] === undefined) {
        return null;
    }
    const slot = TAB_SLOT[testId];
    const w = bar.bounds.x2 - bar.bounds.x1;
    const x1 = bar.bounds.x1 + Math.round((slot * w) / TAB_SLOT_COUNT);
    const x2 = bar.bounds.x1 + Math.round(((slot + 1) * w) / TAB_SLOT_COUNT);
    return {
        bounds: tabClickBounds(
            {
                x: Math.round((x1 + x2) / 2),
                y: bar.bounds.y,
                x1,
                y1: bar.bounds.y1,
                x2,
                y2: bar.bounds.y2,
            },
            nodes,
        ),
    };
};

const FOOTER_LABELS = {
    'next-button': ['Next', 'Done'],
    'finish-button': ['Finish'],
    'save-button': ['Save'],
    'back-button': ['Previous', 'Back'],
};

const pickFooterNode = (xml, testId) => {
    const labels = FOOTER_LABELS[testId];
    if (!labels) {
        return pickNodeForTestId(xml, testId);
    }
    const nodes = parseNodes(xml).filter((n) => !isSystemUiNode(n));
    const want = labels.map((label) => label.toLowerCase());
    const labelHits = nodes.filter((n) => want.indexOf(nodePlainLabel(n).toLowerCase()) !== -1);
    let hit = null;
    if (labelHits.length) {
        const lowest = labelHits.reduce((best, n) => (n.bounds.y1 > best.bounds.y1 ? n : best));
        const item = nodes.find(
            (n) =>
                n.clickable &&
                n.bounds.x1 <= lowest.bounds.x1 &&
                n.bounds.x2 >= lowest.bounds.x2 &&
                n.bounds.y1 <= lowest.bounds.y1 &&
                n.bounds.y2 >= lowest.bounds.y2 &&
                n.bounds.y2 - n.bounds.y1 <= 280 &&
                n.bounds.x2 - n.bounds.x1 <= 520,
        );
        hit = item && item.bounds.x2 - item.bounds.x1 <= 520 ? item : lowest;
    } else {
        hit = pickNodeForTestId(xml, testId);
    }
    if (!hit) {
        return null;
    }
    return { ...hit, bounds: tabClickBounds(hit.bounds, nodes) };
};

const clickByTestId = async (testId) => {
    const el = element(by.id(testId));
    if (device.getPlatform() !== 'android') {
        try {
            await el.tap();
        } catch (e) {
            await el.atIndex(0).tap();
        }
        return;
    }
    // One interaction only. Promise.race/tap-loops leave a pending Detox invoke.
    if (/^\d-key$/.test(testId)) {
        if (!keypadBounds || Date.now() - keypadAt > 4000) {
            await refreshKeypadBounds();
        }
        const bounds = keypadBounds[testId[0]];
        if (!bounds) {
            throw new Error(`android hierarchy has no bounds for ${testId}`);
        }
        await tapBounds(bounds);
        return;
    }
    let xml = await androidDumpXml();
    if (await collapseAndroidStatusBar(xml)) {
        xml = await androidDumpXml();
    }
    if (testId === 'add-and-sign-button' && pickNodeForTestId(xml, 'review-transaction-modal')) {
        return;
    }
    if (TAB_LABELS[testId]) {
        const tab = pickTabNode(xml, testId) || (lastTabXml && pickTabNode(lastTabXml, testId));
        if (!tab) {
            throw new Error(`android hierarchy has no app tab for ${testId} (${dumpSummary(xml || lastTabXml)})`);
        }
        await tapBounds(tab.bounds);
        return;
    }
    if (FOOTER_LABELS[testId]) {
        const footer = pickFooterNode(xml, testId);
        if (footer) {
            await tapBounds(footer.bounds);
            return;
        }
    }
    if (testId === 'close-change-log-button') {
        const close =
            pickNodeForTestId(xml, testId) ||
            parseNodes(xml).find((n) => (n.text || '').trim() === 'Close');
        if (close) {
            await tapBounds(close.bounds);
            return;
        }
    }
    let bounds = await androidBoundsByTestId(testId);
    if (!bounds) {
        await sleep(400);
        bounds = await androidBoundsByTestId(testId);
    }
    if (!bounds) {
        throw new Error(`android hierarchy has no bounds for ${testId} (${dumpSummary(xml)})`);
    }
    await tapBounds(bounds);
};

const tapByTestIdIfPresent = async (testId, timeoutMs = 1500) => {
    if (device.getPlatform() === 'android') {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const bounds = await androidBoundsByTestId(testId);
            if (bounds) {
                await tapBounds(bounds);
                return true;
            }
            await sleep(400);
        }
        return false;
    }
    try {
        await waitFor(element(by.id(testId))).toExist().withTimeout(timeoutMs);
        await clickByTestId(testId);
        return true;
    } catch (e) {
        return false;
    }
};

const E2E_PASSCODE = '167349';

const xmlHasLockOverlay = (xml) => {
    if (!xml) {
        return false;
    }
    return !!pickNodeForTestId(xml, 'lock-overlay');
};

const clickDumpLabel = async (xml, label) => {
    if (!xml || !label) {
        return false;
    }
    const want = String(label).toLowerCase();
    const nodes = parseNodes(xml);
    const pick =
        nodes.find((n) => n.clickable && (n.text || '').toLowerCase() === want) ||
        nodes.find((n) => (n.text || '').toLowerCase() === want);
    if (!pick) {
        return false;
    }
    await tapBounds(pick.bounds);
    cachedXml = '';
    cachedAt = 0;
    return true;
};

const clickAndroidLabel = async (label) => {
    cachedXml = '';
    cachedAt = 0;
    const xml = await androidDumpXml();
    return clickDumpLabel(xml, label);
};

const androidDumpIncludes = async (snippet) => {
    const xml = await androidDumpXml();
    if (!xml || !snippet) {
        return false;
    }
    return xml.toLowerCase().indexOf(String(snippet).toLowerCase()) !== -1;
};

const dismissAndroidWipeDialog = async (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    if (blob.indexOf('wipe xaman') === -1 && blob.indexOf('could not be decrypted') === -1) {
        return false;
    }
    if (await clickDumpLabel(xml, 'WIPE XAMAN')) {
        await sleep(800);
        return true;
    }
    return false;
};

/** Gboard "Try out your stylus" covers Next and steals typed label text. */
const dismissAndroidImeChrome = async (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    if (blob.indexOf('try out your stylus') === -1 && blob.indexOf('write here') === -1) {
        return false;
    }
    if (await clickDumpLabel(xml, 'Cancel')) {
        return true;
    }
    try {
        execFileSync('adb', ['-s', androidSerial(), 'shell', 'input', 'keyevent', '4'], { timeout: 4000 });
    } catch (e) {
        // BACK already down
    }
    cachedXml = '';
    cachedAt = 0;
    return true;
};

const ANDROID_ANIMATION_SCALES = [
    'window_animation_scale',
    'transition_animation_scale',
    'animator_duration_scale',
];

const putAndroidAnimationScale = (value) => {
    ANDROID_ANIMATION_SCALES.forEach((key) => {
        try {
            execFileSync(
                'adb',
                ['-s', androidSerial(), 'shell', 'settings', 'put', 'global', key, String(value)],
                { timeout: 4000 },
            );
        } catch (e) {
            // ignore
        }
    });
};

const disableAndroidStylusHandwriting = () => {
    try {
        execFileSync(
            'adb',
            ['-s', androidSerial(), 'shell', 'settings', 'put', 'secure', 'stylus_handwriting_enabled', '0'],
            { timeout: 4000 },
        );
    } catch (e) {
        // ignore
    }
};

const restoreAndroidAnimationScale = () => {
    putAndroidAnimationScale(1);
};

const xmlLooksLikePasscodeSetup = (xml) => {
    if (!xml) {
        return false;
    }
    return !!(
        pickNodeForTestId(xml, 'setup-passcode-screen') ||
        pickNodeForTestId(xml, 'pin-code-explanation-view') ||
        pickNodeForTestId(xml, 'go-button') ||
        pickNodeForTestId(xml, '1-key')
    );
};

const xmlLooksLikeHomeEmpty = (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    if (blob.indexOf('home-tab-empty-view') !== -1) {
        return true;
    }
    if (blob.indexOf('add-account-button') !== -1 && blob.indexOf('welcome to xaman') !== -1) {
        return true;
    }
    return blob.indexOf('welcome to xaman') !== -1 && blob.indexOf('create a new account') !== -1;
};

const xmlLooksLikeChangelog = (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    return (
        blob.indexOf('change-log-overlay') !== -1 ||
        blob.indexOf('close-change-log-button') !== -1 ||
        blob.indexOf("what's new") !== -1 ||
        blob.indexOf('whats new') !== -1
    );
};

const xmlLooksLikeSettings = (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    if (
        blob.indexOf('settings-tab-screen') !== -1 ||
        blob.indexOf('advanced-button') !== -1 ||
        blob.indexOf('general-button') !== -1 ||
        blob.indexOf('address-book-button') !== -1
    ) {
        return true;
    }
    const labels = parseNodes(xml).map((n) => nodePlainLabel(n).toLowerCase());
    const has = (want) => labels.some((l) => l === want || l.indexOf(want) !== -1);
    return has('advanced') && has('security');
};

const dumpXmlForWait = async (testId) => {
    // Changelog WebView keeps accessibility busy after ToS→Home setRoot.
    // Do not start a second dump; BACK lets the in-flight waitForIdle finish.
    if (testId !== 'home-tab-empty-view') {
        return androidDumpXml();
    }
    const dumpP = androidDumpXml();
    const raced = await Promise.race([
        dumpP.then((xml) => ({ xml })),
        sleep(6000).then(() => ({ slow: true })),
    ]);
    if (raced.slow) {
        pressAndroidBack();
        return dumpP;
    }
    return raced.xml;
};

const waitUntilAndroidTestId = async (testId, timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    let lastXml = '';
    const dismissOverlay = testId.indexOf('home-tab') === 0 || testId.indexOf('tab-') === 0;
    const unlockIfBlocking =
        dismissOverlay ||
        testId === 'settings-tab-screen' ||
        testId === 'accounts-list-screen' ||
        testId === 'accounts-button' ||
        testId === 'save-button';
    while (Date.now() < deadline) {
        if (TAB_LABELS[testId] && lastTabXml && pickTabNode(lastTabXml, testId)) {
            return;
        }
        lastXml = await dumpXmlForWait(testId);
        if (await dismissAndroidWipeDialog(lastXml)) {
            await sleep(500);
            continue;
        }
        // Samsung keeps GMS rows in the dump after collapse; do not continue.
        await collapseAndroidStatusBar(lastXml);
        // Push opt-in and biometric setup sit between PIN and ToS.
        // Physical devices use skip-button; emu used maybe-later-button.
        if (
            pickNodeForTestId(lastXml, 'maybe-later-button') ||
            pickNodeForTestId(lastXml, 'permission-setup-view') ||
            pickNodeForTestId(lastXml, 'biometric-setup-view') ||
            pickNodeForTestId(lastXml, 'skip-button')
        ) {
            const later =
                pickNodeForTestId(lastXml, 'maybe-later-button') ||
                pickNodeForTestId(lastXml, 'skip-button');
            if (later) {
                await tapBounds(later.bounds);
                cachedXml = '';
                cachedAt = 0;
                await sleep(500);
                continue;
            }
            if (await clickDumpLabel(lastXml, 'Maybe later')) {
                cachedXml = '';
                cachedAt = 0;
                await sleep(500);
                continue;
            }
        }
        if (lastXml.toLowerCase().indexOf('alerttitle') !== -1 || lastXml.toLowerCase().indexOf('do not match') !== -1) {
            if (await clickDumpLabel(lastXml, 'OK')) {
                await sleep(300);
                continue;
            }
        }
        if (await dismissAndroidImeChrome(lastXml)) {
            await sleep(300);
            continue;
        }
        if (
            (testId === 'next-button' || testId === 'finish-button' || testId === 'save-button') &&
            lastXml.indexOf('inputmethod.latin') !== -1 &&
            !pickNodeForTestId(lastXml, testId)
        ) {
            // BACK pops import/generate (Upgrade Account). ESC blurs IME only.
            try {
                execFileSync('adb', ['-s', androidSerial(), 'shell', 'input', 'keyevent', '111'], { timeout: 4000 });
            } catch (e) {
                // IME
            }
            cachedXml = '';
            cachedAt = 0;
            await sleep(300);
            continue;
        }
        if (dismissOverlay && lastXml) {
            const close =
                pickNodeForTestId(lastXml, 'close-change-log-button') ||
                parseNodes(lastXml).find((n) => (n.text || '').trim().toLowerCase() === 'close');
            if (close) {
                await tapBounds(close.bounds);
                cachedXml = '';
                cachedAt = 0;
                await sleep(400);
                continue;
            }
            if (xmlLooksLikeChangelog(lastXml)) {
                pressAndroidBack();
                cachedXml = '';
                cachedAt = 0;
                await sleep(400);
                continue;
            }
        }
        if (
            (testId === 'home-tab-view' ||
                testId === 'home-tab-empty-view' ||
                testId === 'account-address-text') &&
            xmlLooksLikeSettings(lastXml)
        ) {
            const tab = pickTabNode(lastXml, 'tab-Home') || (lastTabXml && pickTabNode(lastTabXml, 'tab-Home'));
            if (tab) {
                await tapBounds(tab.bounds);
                cachedXml = '';
                cachedAt = 0;
                await sleep(500);
                continue;
            }
        }
        if (lastXml) {
            const pick = pickNodeForTestId(lastXml, testId);
            if (pick) {
                if (
                    (testId === 'home-tab-view' || testId === 'home-tab-empty-view') &&
                    xmlLooksLikeSettings(lastXml)
                ) {
                    // RNN keeps the Home root mounted on Settings.
                } else {
                    return;
                }
            }
            if (
                TAB_LABELS[testId] &&
                (pickTabNode(lastXml, testId) || (lastTabXml && pickTabNode(lastTabXml, testId)))
            ) {
                return;
            }
            if (FOOTER_LABELS[testId] && pickFooterNode(lastXml, testId)) {
                return;
            }
            if (testId === 'setup-passcode-screen' && xmlLooksLikePasscodeSetup(lastXml)) {
                return;
            }
            if (
                testId === 'pin-code-explanation-view' &&
                (pickNodeForTestId(lastXml, 'pin-code-entry-view') || pickNodeForTestId(lastXml, '1-key'))
            ) {
                return;
            }
            if (testId === 'add-and-sign-button' && pickNodeForTestId(lastXml, 'review-transaction-modal')) {
                return;
            }
            if (testId === 'home-tab-empty-view' && xmlLooksLikeHomeEmpty(lastXml)) {
                return;
            }
            if (testId === 'settings-tab-screen' && xmlLooksLikeSettings(lastXml)) {
                return;
            }
            if (
                testId === 'settings-tab-screen' &&
                !xmlLooksLikeSettings(lastXml) &&
                pickTabNode(lastXml, 'tab-Settings')
            ) {
                const tab = pickTabNode(lastXml, 'tab-Settings');
                await tapBounds(tab.bounds);
                cachedXml = '';
                cachedAt = 0;
                await sleep(500);
                continue;
            }
        }
        // Do not auto-unlock AuthenticateOverlay (same testID) during signing.
        if (unlockIfBlocking && xmlHasLockOverlay(lastXml) && pickNodeForTestId(lastXml, '1-key')) {
            await enterAndroidPasscode(E2E_PASSCODE);
            await sleep(400);
            cachedXml = '';
            cachedAt = 0;
            continue;
        }
        await sleep(400);
    }
    if (testId === 'home-tab-empty-view' || testId === 'home-tab-view') {
        const fb = lastXml || adbFallbackDump();
        if (xmlLooksLikeSettings(fb)) {
            throw new Error(`android hierarchy timed out waiting for ${testId} (${dumpSummary(lastXml)})`);
        }
        if (xmlLooksLikeHomeEmpty(fb) || pickNodeForTestId(fb, testId) || dumpHasRnContent(fb)) {
            return;
        }
    }
    if (TAB_LABELS[testId] && lastTabXml && pickTabNode(lastTabXml, testId)) {
        return;
    }
    throw new Error(`android hierarchy timed out waiting for ${testId} (${dumpSummary(lastXml)})`);
};

const unlockAndroidPasscodeIfPresent = async () => {
    if (device.getPlatform() !== 'android') {
        return false;
    }
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
        cachedXml = '';
        cachedAt = 0;
        const xml = await androidDumpXml();
        if (xmlHasLockOverlay(xml)) {
            await enterAndroidPasscode(E2E_PASSCODE);
            const goneBy = Date.now() + 5000;
            while (Date.now() < goneBy) {
                cachedXml = '';
                cachedAt = 0;
                const after = await androidDumpXml();
                if (!xmlHasLockOverlay(after)) {
                    return true;
                }
                await sleep(300);
            }
            return true;
        }
        if (dumpHasAppContent(xml) && !xmlHasLockOverlay(xml)) {
            return false;
        }
        await sleep(300);
    }
    return false;
};

const androidHasTestId = async (testId) => {
    cachedXml = '';
    cachedAt = 0;
    const xml = await androidDumpXml();
    if (testId === 'settings-tab-screen') {
        return xmlLooksLikeSettings(xml);
    }
    if (testId === 'setup-passcode-screen') {
        return xmlLooksLikePasscodeSetup(xml);
    }
    if (testId === 'home-tab-empty-view') {
        return xmlLooksLikeHomeEmpty(xml);
    }
    return !!pickNodeForTestId(xml, testId);
};

const adbSwipe = (x1, y1, x2, y2) => {
    execFileSync(
        'adb',
        ['-s', androidSerial(), 'shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2), '300'],
        { timeout: 5000 },
    );
};

const swipeBounds = async (x1, y1, x2, y2) => {
    adbSwipe(x1, y1, x2, y2);
    cachedXml = '';
    cachedAt = 0;
};

const androidSwipeTestId = async (testId, direction) => {
    await waitUntilAndroidTestId(testId, 10000);
    const bounds = await androidBoundsByTestId(testId);
    if (!bounds) {
        throw new Error(`android hierarchy has no bounds for ${testId}`);
    }
    if (direction === 'right') {
        // accept-button testID is the thumb, not the track. Swipe across the
        // review sheet, not the full display (OS nav sits to the right/bottom).
        const xml = await androidDumpXml();
        const sheet =
            pickNodeForTestId(xml, 'review-transaction-modal') ||
            pickNodeForTestId(xml, 'review-content-container');
        const startX = Math.round(bounds.x1 + Math.min(24, Math.max(8, (bounds.x2 - bounds.x1) / 2)));
        const endX = sheet
            ? Math.max(startX + 200, sheet.bounds.x2 - 24)
            : Math.max(startX + 200, bounds.x2 + (bounds.x2 - bounds.x1) * 6);
        await swipeBounds(startX, bounds.y, endX, bounds.y, 80);
        return;
    }
    if (direction === 'up') {
        // Start in the sheet, not at y2. On gesture-nav emu y2 sits on the
        // Home pill (launcher). Stay above the Xaman content bottom.
        const xml = await androidDumpXml();
        const nodes = parseNodes(xml);
        const bottom = xummContentBottom(nodes) || bounds.y2;
        const h = Math.max(1, bounds.y2 - bounds.y1);
        const x = Math.round((bounds.x1 + bounds.x2) / 2);
        let startY = Math.round(bounds.y1 + h * 0.55);
        let endY = Math.round(bounds.y1 + h * 0.18);
        const maxStart = bottom - 96;
        if (startY > maxStart) {
            startY = Math.max(bounds.y1 + 40, maxStart);
        }
        if (endY >= startY - 80) {
            endY = Math.max(bounds.y1 + 16, startY - 160);
        }
        await swipeBounds(x, startY, x, endY);
        return;
    }
    await swipeBounds(bounds.x, bounds.y1 + 20, bounds.x, bounds.y2 - 20, 40);
};

const androidAdb = (args, timeout = 8000) =>
    execFileSync('adb', ['-s', androidSerial(), ...args], { timeout, encoding: 'utf8' });

const androidBlurIme = () => {
    try {
        androidAdb(['shell', 'input', 'keyevent', '111'], 4000);
    } catch (e) {
        // IME already down
    }
};

const androidPasteText = (value) => {
    const text = String(value);
    try {
        androidAdb(['shell', 'cmd', 'clipboard', 'set-text', text], 6000);
        androidAdb(['shell', 'input', 'keyevent', '279'], 4000);
        return true;
    } catch (e) {
        try {
            androidAdb(['shell', 'cmd', 'clipboard', 'set', '--user', '0', 'text', text], 6000);
            androidAdb(['shell', 'input', 'keyevent', '279'], 4000);
            return true;
        } catch (e2) {
            return false;
        }
    }
};

const isAdbTimeout = (err) => {
    const m = String((err && err.message) || err);
    return m.indexOf('ETIMEDOUT') !== -1 || m.indexOf('ETIMEDOUT'.toLowerCase()) !== -1 || m.indexOf('timed out') !== -1;
};

const androidTypeChunk = (chunk) => {
    const encoded = String(chunk).replace(/ /g, '%s');
    const quoted = `'${encoded.replace(/'/g, `'\\''`)}'`;
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            androidAdb(['shell', `input text ${quoted}`], 12000);
            return;
        } catch (e) {
            lastErr = e;
            if (!isAdbTimeout(e)) {
                throw e;
            }
        }
    }
    throw lastErr;
};

/**
 * Type into the focused Android field. Long `input text` hangs on some
 * Samsungs (family seeds). Prefer clipboard paste, then short chunks.
 * On adb timeout, paste whatever is left — do not fail the step if the
 * field already accepted the value (caller checks dump).
 * Quote for device sh so `& ; < > | #` in Extra Security passphrases
 * are not split. `input text` maps `%s` to space.
 */
const androidTypeText = (value) => {
    const text = String(value);
    if (!text) {
        return;
    }
    // Do not paste first: Samsung cmd clipboard + KEYCODE_PASTE often no-ops
    // in RN TextInput while returning success (empty account label, Next dead).
    const encoded = text.replace(/ /g, '%s');
    const size = text.length > 10 ? 6 : encoded.length;
    for (let i = 0; i < encoded.length; i += size) {
        try {
            androidTypeChunk(encoded.slice(i, i + size));
        } catch (e) {
            if (!isAdbTimeout(e)) {
                throw e;
            }
            const rest = text.slice(i);
            if (rest) {
                androidPasteText(rest);
            }
            return;
        }
    }
};

const clickNearestEdit = async (nodes, target) => {
    if (!target) {
        return false;
    }
    const edits = nodes.filter(
        (n) => n.clickable && ((n.text || '') === 'Edit' || resourceIdTail(n.resourceId).indexOf('account-') === 0),
    );
    if (!edits.length) {
        return false;
    }
    let best = edits[0];
    let bestDist = Math.abs(best.bounds.y - target.bounds.y);
    for (let i = 1; i < edits.length; i += 1) {
        const dist = Math.abs(edits[i].bounds.y - target.bounds.y);
        if (dist < bestDist) {
            best = edits[i];
            bestDist = dist;
        }
    }
    await tapBounds(best.bounds);
    return true;
};

// FlatList only mounts on-screen rows. After 03 the target (I-ReadOnly) is below the fold.
const swipeAccountListUp = async (xml) => {
    const list = xml ? pickNodeForTestId(xml, 'account-list-scroll') : null;
    cachedXml = '';
    cachedAt = 0;
    const screen =
        list ||
        (xml && pickNodeForTestId(xml, 'accounts-list-screen')) ||
        (xml && pickNodeForTestId(xml, 'home-tab-view'));
    if (!screen) {
        await sleep(500);
        return;
    }
    const b = screen.bounds;
    const startY = Math.max(b.y1 + 80, b.y2 - 80);
    const endY = b.y1 + 80;
    await swipeBounds(b.x, startY, b.x, endY, 70);
    await sleep(500);
};

const SECRET_LETTERS = 'ABCDEFGH';

const exactNodeForTestId = (xml, testId) => {
    const nodes = parseNodes(xml).filter((n) => !isSystemUiNode(n));
    return nodes.find((n) => {
        const tail = resourceIdTail(n.resourceId);
        return tail === testId || n.contentDesc === testId;
    });
};

const androidShowSecretRowLetter = (xml) => {
    if (!xml) {
        return '';
    }
    const show = xml.match(/secret numbers of row ([a-h])/i);
    if (show) {
        return show[1].toUpperCase();
    }
    const confirm = xml.match(/confirm the numbers of row ([a-h])/i);
    if (confirm) {
        return confirm[1].toUpperCase();
    }
    return '';
};

const dismissAndroidInvalidSecret = async (xml) => {
    if (!xml) {
        return false;
    }
    const blob = xml.toLowerCase();
    if (
        blob.indexOf('invalid') === -1 &&
        blob.indexOf('do not match') === -1 &&
        blob.indexOf('requested row') === -1
    ) {
        return false;
    }
    return clickDumpLabel(xml, 'OK');
};

const androidReadSecretRow = async (row) => {
    const letter = SECRET_LETTERS[row];
    const deadline = Date.now() + 40000;
    let lastXml = '';
    while (Date.now() < deadline) {
        lastXml = await androidDumpXml();
        const shown = androidShowSecretRowLetter(lastXml);
        if (shown && shown !== letter) {
            await sleep(250);
            continue;
        }
        const cells = [];
        let missing = false;
        for (let c = 0; c < 6; c += 1) {
            const pick = exactNodeForTestId(lastXml, `${row}.${c}`);
            const text = pick ? String(pick.text || '').trim() : '';
            if (!/^\d$/.test(text)) {
                missing = true;
                break;
            }
            cells.push(text);
        }
        if (!missing) {
            return cells;
        }
        await sleep(300);
    }
    throw new Error(`secret cell ${row}.* missing from hierarchy (${dumpSummary(lastXml)})`);
};

/**
 * Confirm/import secret rows auto-advance 150ms after the 6th digit and ignore
 * extra taps until clearPin. Burst-tapping all 48 keys lands row B on row C's
 * digits (Invalid on B). Pause per key and wait for the row to advance.
 */
const enterAndroidSecretNumbers = async (rows) => {
    for (let r = 0; r < rows.length; r += 1) {
        const letter = SECRET_LETTERS[r];
        let advanced = false;
        for (let attempt = 0; attempt < 3 && !advanced; attempt += 1) {
            const readyBy = Date.now() + 20000;
            while (Date.now() < readyBy) {
                cachedXml = '';
                cachedAt = 0;
                const xml = await androidDumpXml();
                if (await dismissAndroidInvalidSecret(xml)) {
                    await sleep(400);
                    continue;
                }
                if (pickNodeForTestId(xml, '1-key')) {
                    break;
                }
                await sleep(250);
            }
            const digits = rows[r] || [];
            keypadBounds = null;
            keypadAt = 0;
            await refreshKeypadBounds();
            for (let c = 0; c < digits.length; c += 1) {
                const d = String(digits[c]);
                if (!/^\d$/.test(d)) {
                    throw new Error(`secret row ${letter} col ${c} is not a digit: ${JSON.stringify(d)}`);
                }
                const bounds = keypadBounds[d];
                if (!bounds) {
                    throw new Error(`secret keypad missing ${d}-key (${dumpSummary(cachedXml)})`);
                }
                await tapBounds(bounds);
                await sleep(200);
            }
            // validateRow schedules goNext/clearPin after 150ms.
            await sleep(800);
            cachedXml = '';
            cachedAt = 0;
            const xml = await androidDumpXml();
            if (await dismissAndroidInvalidSecret(xml)) {
                await sleep(500);
                continue;
            }
            if (r === rows.length - 1) {
                return;
            }
            const shown = androidShowSecretRowLetter(xml);
            const nextLetter = SECRET_LETTERS[r + 1];
            if (!shown || shown === nextLetter) {
                advanced = true;
            } else if (shown === letter) {
                // still on this row — retry
                continue;
            } else {
                advanced = true;
            }
        }
        if (!advanced && r < rows.length - 1) {
            throw new Error(`secret row ${letter} did not advance after entry`);
        }
    }
};

const clickAndroidAccountRow = async (address, label) => {
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
        const xml = await androidDumpXml();
        if (address && pickNodeForTestId(xml, `account-${address}`)) {
            await clickByTestId(`account-${address}`);
            return;
        }
        const nodes = parseNodes(xml);
        if (address) {
            const addrNode = nodes.find((n) => n.text && n.text.indexOf(address) !== -1);
            if (await clickNearestEdit(nodes, addrNode)) {
                return;
            }
        }
        if (label) {
            const title = nodes.find((n) => (n.text || '') === label);
            if (await clickNearestEdit(nodes, title)) {
                return;
            }
        }
        await swipeAccountListUp(xml);
    }
    throw new Error(`android account row not found (${address || label || ''})`);
};

/**
 * FinishView → Navigator.startDefault() → Navigation.setRoot(bottomTabs).
 * The ToS WebView root is torn down; Detox dump is empty until we attach to
 * the new DefaultRoot. Same testIDs as iOS (`home-tab-empty-view`, `tab-Settings`).
 */
const waitForAndroidDefaultRoot = async (timeoutMs = 30000) => {
    // Do not dump and waitFor at the same time — that is "multiple interactions"
    // and wedges UiAutomation. setRoot has already swapped the tree; match Home
    // the same way iOS does, then dump once.
    dumpBroken = false;
    cachedXml = '';
    cachedAt = 0;
    try {
        await device.disableSynchronization();
    } catch (e) {
        // already off
    }
    await sleep(2500);
    await waitUntilAndroidTestId('home-tab-empty-view', timeoutMs);
    await captureAndroidTabBar();
};

const captureAndroidTabBar = async () => {
    if (lastTabXml && pickTabNode(lastTabXml, 'tab-Settings')) {
        return lastTabXml;
    }
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
        cachedXml = '';
        cachedAt = 0;
        const xml = await androidDumpXml();
        if (xmlHasAppTabs(xml)) {
            return xml;
        }
        await sleep(800);
    }
    return lastTabXml || '';
};

const waitUntilAndroidEnabled = async (testId, timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    let lastXml = '';
    while (Date.now() < deadline) {
        lastXml = await androidDumpXml();
        const pick = pickNodeForTestId(lastXml, testId);
        if (pick && pick.enabled) {
            return;
        }
        await sleep(800);
    }
    throw new Error(`android ${testId} not enabled (${dumpSummary(lastXml)})`);
};

const clearAndroidBlockingDialogs = async () => {
    for (let i = 0; i < 5; i += 1) {
        cachedXml = '';
        cachedAt = 0;
        const xml = await androidDumpXml();
        if (!(await dismissAndroidWipeDialog(xml))) {
            return;
        }
        await sleep(500);
    }
};

module.exports = {
    clickByTestId,
    tapByTestIdIfPresent,
    waitUntilAndroidTestId,
    waitUntilAndroidEnabled,
    waitUntilAndroidRnReady,
    unlockAndroidPasscodeIfPresent,
    enterAndroidPasscode,
    androidReadTextByTestId,
    androidHasTestId,
    androidSwipeTestId,
    androidTypeText,
    androidBlurIme,
    isAdbTimeout,
    androidDumpIncludes,
    clickAndroidLabel,
    disableAndroidStylusHandwriting,
    restoreAndroidAnimationScale,
    adbTapChangelogClose,
    androidClearBlockingUi,
    captureAndroidTabBar,
    waitForAndroidDefaultRoot,
    isAndroidDumpBroken: () => dumpBroken,
    clickAndroidAccountRow,
    androidReadSecretRow,
    enterAndroidSecretNumbers,
    dismissAndroidWipeDialog,
    clearAndroidBlockingDialogs,
};
