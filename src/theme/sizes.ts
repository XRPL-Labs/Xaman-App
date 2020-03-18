/**
 * App Theme - Sizes
 */

/* eslint-disable spellcheck/spell-checker */

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('screen');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const Sizes = {
    // Window Dimensions
    screen: {
        height,
        width,

        heightHalf: height * 0.5,
        heightThird: height * 0.333,
        heightTwoThirds: height * 0.666,
        heightQuarter: height * 0.25,
        vThreeQuarters: height * 0.75,

        widthHalf: width * 0.5,
        widthThird: width * 0.333,
        widthTwoThirds: width * 0.666,
        widthQuarter: width * 0.25,
        widthThreeQuarters: width * 0.75,
    },
    navbarHeight: Platform.OS === 'ios' ? 60 : 50,
    statusBarHeight: Platform.OS === 'ios' ? 16 : 0,
    tabbarHeight: 50,

    padding: 30,
    paddingSml: 20,
    paddingExtraSml: 10,

    borderRadius: 8,

    scale: (size: number) => (width / guidelineBaseWidth) * size,
    verticalScale: (size: number) => (height / guidelineBaseHeight) * size,
    moderateScale: (size: number, factor = 0.5) => size + (Sizes.scale(size) - size) * factor,

    widthPercentageToDP: (widthPercent: number) => PixelRatio.roundToNearestPixel((width * widthPercent) / 100),
    heightPercentageToDP: (heightPercent: number) => PixelRatio.roundToNearestPixel((height * heightPercent) / 100),
};

export default Sizes;
