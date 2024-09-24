/* eslint-disable spellcheck/spell-checker */
const ColorLuminance = (hex: string, lum: number) => {
    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    let rgb = '#';
    let c;
    let i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
        rgb += `00${c}`.substr(c.length);
    }
    return rgb;
};

const HexToRgbA = (hex: string, opacity: number) => {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = `0x${c.join('')}`;
        // @ts-ignore
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity})`;
    }
    throw new Error(`HexToRgbA: ${hex} is not a valid hex value!`);
};

const TextContrast = (hex: string): string => {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        const hexColor = hex.replace('#', '');
        // convert hex to rgb
        const rgb = [] as number[];
        const bigint = parseInt(hexColor, 16);
        rgb[0] = (bigint >> 16) & 255;
        rgb[1] = (bigint >> 8) & 255;
        rgb[2] = bigint & 255;

        const brightness = Math.round(
            (parseInt(String(rgb[0]), 10) * 299 +
                parseInt(String(rgb[1]), 10) * 587 +
                parseInt(String(rgb[2]), 10) * 114) /
                1000,
        );

        return brightness > 125 ? 'dark' : 'light';
    }

    throw new Error(`TextContrast: ${hex} is not a valid hex value!`);
};

/* Export ==================================================================== */
export { ColorLuminance, HexToRgbA, TextContrast };
