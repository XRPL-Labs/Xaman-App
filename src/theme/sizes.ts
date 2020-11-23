/**
 * App Theme - Sizes
 */

import { Dimensions, Platform, PixelRatio, StatusBar } from 'react-native';

import { IsIPhoneX } from '@common/helpers/device';

const { width, height } = Dimensions.get('screen');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

// bottomTabs height
const tabbarHeight = Platform.select({
    ios: IsIPhoneX() ? 95 : 50,
    android: 60,
    default: 0,
});

// status bar size
const statusBarHeight = Platform.select({
    ios: IsIPhoneX() ? 44 : 20,
    android: StatusBar.currentHeight,
    default: 0,
});

// soft menu bar
const navigationBarHeight = Platform.OS === 'android' ? height - Dimensions.get('window').height + 10 : 0;

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
    navigationBarHeight,
    statusBarHeight,
    tabbarHeight,

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
