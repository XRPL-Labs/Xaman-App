/**
 * App Theme - Sizes
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

import { hasNotch, GetLayoutInsets } from '@common/helpers/device';

const { height: screenHeight } = Dimensions.get('screen');
const { width, height } = Dimensions.get('window');

const { bottom: bottomInset, top: topInset } = GetLayoutInsets();

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

// bottomTabs height
const tabbarHeight = Platform.select({
    ios: hasNotch() ? 95 : 50,
    android: 60,
    default: 0,
});

// status bar size
const statusBarHeight = topInset;

// in some android devices the screen goes under navigation bar
// this help's us to add extra padding if necessary
let bottomStableInset = 0;

if (Platform.OS === 'android') {
    bottomStableInset = Math.floor(topInset + bottomInset - Math.floor(screenHeight - height));
    if (bottomStableInset < 0) {
        bottomStableInset = 0;
    }
} else if (Platform.OS === 'ios') {
    bottomStableInset = bottomInset;
}

const Sizes = {
    // Screen Dimensions
    screen: {
        height,
        width,

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
    },
    statusBarHeight,
    tabbarHeight,

    bottomInset,
    topInset,
    bottomStableInset,

    padding: 30,
    paddingSml: 20,
    paddingExtraSml: 10,

    borderRadius: 8,

    extraKeyBoardPadding: 20,

    scale: (size: number) => (width / guidelineBaseWidth) * size,
    verticalScale: (size: number) => (height / guidelineBaseHeight) * size,
    moderateScale: (size: number, factor = 0.5) => size + (Sizes.scale(size) - size) * factor,

    widthPercentageToDP: (widthPercent: number) => PixelRatio.roundToNearestPixel((width * widthPercent) / 100),
    heightPercentageToDP: (heightPercent: number) => PixelRatio.roundToNearestPixel((height * heightPercent) / 100),
};

export default Sizes;
