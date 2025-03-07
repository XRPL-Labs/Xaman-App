/**
 * App Theme - Colors
 */

import { ColorLuminance, HexToRgbA } from '@common/utils/color';

const colors = {
    blue: '#0030CF',
    darkBlue: '#181D41',
    orange: '#F8BF4C',
    green: '#3BDC96',
    red: '#FF5B5B',
    purple: '#572B81',

    black: '#000000',
    white: '#ffffff',

    grey: '#606885',
    silver: '#ACB1C1',
    // light: '#F8FAFD',
    light: '#F3F6FA',

    themeLight: '#ffffff',
    themeDark: '#000000',
    themeMoonlight: '#181A21',
    themeRoyal: '#030B36',

    transparent: 'transparent',

    brandBithomp: '#3fa3b5',
    brandXrplns: '#3767CE',
    brandXrpscan: '#004a7c',
    brandPayid: '#38D39F',
    brandFIO: '#564FC6',
};

const ColorsGeneral = {
    ...colors,
    // testBlue: ColorLuminance(colors.blue, -0.5),
    // lightBlue: ColorLuminance(colors.blue, -0.5),
    transparentBlue: HexToRgbA(colors.blue, 0.7),
    transparentBlack: HexToRgbA(colors.black, 0.7),
    transparentWhite: HexToRgbA(colors.white, 0.4),

    darkGrey: ColorLuminance(colors.grey, -0.75),
    darkRed: ColorLuminance(colors.red, -0.3),
    darkGreen: ColorLuminance(colors.green, -0.3),
};

const ColorsTheme = {
    light: {
        background: colors.white,
        tint: colors.light,
        contrast: colors.black,
        transparentContrast: HexToRgbA(colors.black, 0.1),
        textContrast: colors.white,
        textPrimary: colors.black,
        textSecondary: colors.grey,

        lightBlue: HexToRgbA(colors.blue, 0.06),
        lightOrange: HexToRgbA(colors.orange, 0.06),
        lightGreen: HexToRgbA(colors.green, 0.06),
        lightRed: HexToRgbA(colors.red, 0.06),
        lightGrey: HexToRgbA(colors.grey, 0.06),
    },
    dark: {
        // THEME Dark
        background: colors.black,
        tint: ColorLuminance(colors.grey, -0.75),
        contrast: colors.white,
        transparentContrast: HexToRgbA(colors.white, 0.1),
        textContrast: colors.black,
        textPrimary: colors.white,
        textSecondary: colors.silver,

        lightBlue: HexToRgbA(colors.blue, 0.22),
        lightOrange: HexToRgbA(colors.orange, 0.22),
        lightGreen: HexToRgbA(colors.green, 0.22),
        lightRed: HexToRgbA(colors.red, 0.22),
        lightGrey: HexToRgbA(colors.grey, 0.22),
    },
    moonlight: {
        // THEME Moonlight
        background: colors.themeMoonlight,
        tint: ColorLuminance(colors.grey, -0.65),
        contrast: colors.white,
        transparentContrast: HexToRgbA(colors.white, 0.1),
        textContrast: colors.black,
        textPrimary: colors.white,
        textSecondary: colors.silver,

        lightBlue: HexToRgbA(colors.blue, 0.17),
        lightOrange: HexToRgbA(colors.orange, 0.17),
        lightGreen: HexToRgbA(colors.green, 0.17),
        lightRed: HexToRgbA(colors.red, 0.17),
        lightGrey: HexToRgbA(colors.grey, 0.17),
    },
    royal: {
        // THEME Dark
        background: colors.themeRoyal,
        tint: ColorLuminance(colors.blue, -0.55),
        contrast: colors.white,
        transparentContrast: HexToRgbA(colors.white, 0.1),
        textContrast: colors.black,
        textPrimary: colors.white,
        textSecondary: colors.silver,

        lightBlue: HexToRgbA(colors.blue, 0.25),
        lightOrange: HexToRgbA(colors.orange, 0.17),
        lightGreen: HexToRgbA(colors.green, 0.17),
        lightRed: HexToRgbA(colors.red, 0.17),
        lightGrey: HexToRgbA(colors.grey, 0.17),
    },
};

export default ColorsGeneral;

export { ColorsGeneral, ColorsTheme };
