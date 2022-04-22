/**
 * Compare two dotted version strings (like '10.2.3').
 * @returns number 0: v1 == v2, -1: v1 < v2, 1: v1 > v2
 */
const VersionDiff = (v1: string, v2: string): number => {
    const v1parts = `${v1}`.split('.');
    const v2parts = `${v2}`.split('.');

    const minLength = Math.min(v1parts.length, v2parts.length);

    let p1;
    let p2;

    // Compare tuple pair-by-pair.
    for (let i = 0; i < minLength; i++) {
        // Convert to integer if possible, because "8" > "10".
        p1 = parseInt(v1parts[i], 10);
        p2 = parseInt(v2parts[i], 10);
        if (Number.isNaN(p1)) {
            p1 = v1parts[i];
        }
        if (Number.isNaN(p2)) {
            p2 = v2parts[i];
        }
        if (p1 === p2) {
            continue;
        } else if (p1 > p2) {
            return 1;
        } else if (p1 < p2) {
            return -1;
        }
        // one operand is NaN
        return NaN;
    }
    // The longer tuple is always considered 'greater'
    if (v1parts.length === v2parts.length) {
        return 0;
    }
    return v1parts.length < v2parts.length ? -1 : 1;
};

/* Export ==================================================================== */
export { VersionDiff };
