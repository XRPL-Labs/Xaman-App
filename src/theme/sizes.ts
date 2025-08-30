/**
 * App Theme - Sizes
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

import { GetLayoutInsets } from '@common/helpers/device';

const { height: screenHeight } = Dimensions.get('screen');
const { width, height } = Dimensions.get('window');

const { bottom: bottomInset, top: topInset } = GetLayoutInsets();

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const isSmallDevice = width <= 375;

const xyFactor = width / height;
const isSquareScreen = xyFactor > 0.85; // Fixes fold devices
const altScreenDimensionsCorrectionFactor = isSquareScreen // Fixes fold devices
    ? 2
    : 1;

// bottomTabs height
const tabbarHeight = Platform.select({
    ios: bottomInset + 50,
    android: 60,
    default: 0,
});

// status bar size
const statusBarHeight = topInset;

// in some android devices the screen goes under navigation bar
// this help's us to add extra padding if necessary
let safeAreaBottomInset = 0;
if (Platform.OS === 'android') {
    safeAreaBottomInset = Math.floor(topInset + bottomInset - Math.floor(screenHeight - height));
    if (safeAreaBottomInset < 0) {
        safeAreaBottomInset = 0;
    }
} else if (Platform.OS === 'ios') {
    safeAreaBottomInset = bottomInset;
}

let safeAreaTopInset = 0;
if (Platform.OS === 'ios') {
    safeAreaTopInset = topInset;
}

const Sizes = {
    // Screen Dimensions
    screen: {
        height,
        width: width / altScreenDimensionsCorrectionFactor, // Fixes fold devices
        uncorrectedWidth: width,

        screenHeight,

        heightHalf: height * 0.5,
        heightThird: height * 0.333,
        heightTwoThirds: height * 0.666,
        heightQuarter: height * 0.25,
        heightThreeQuarters: height * 0.75,

        widthHalf: width * 0.5,
        widthThird: width * 0.333,
        widthTwoThirds: width * 0.666,
        widthQuarter: width * 0.25,
        widthThreeQuarters: width * 0.75,
        isSmallDevice,
    },
    statusBarHeight,
    tabbarHeight,

    bottomInset,
    topInset,

    safeAreaBottomInset,
    safeAreaTopInset,

    padding: 30,
    paddingSml: 20,
    paddingMid: 15,
    paddingExtraSml: 10,

    paddingList: 20,

    borderRadius: 8,

    extraKeyBoardPadding: 20,

    scale: (size: number) => ((width / guidelineBaseWidth) * size) / altScreenDimensionsCorrectionFactor,
    verticalScale: (size: number) => (height / guidelineBaseHeight) * size,
    moderateScale: (size: number, factor = 0.5) => size + (Sizes.scale(size) - size) * factor,

    widthPercentageToDP: (widthPercent: number) => PixelRatio.roundToNearestPixel((width * widthPercent) / 100),
    heightPercentageToDP: (heightPercent: number) => PixelRatio.roundToNearestPixel((height * heightPercent) / 100),
};

export default Sizes;
