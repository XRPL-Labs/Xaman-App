import { Dimensions, Platform, PixelRatio } from 'react-native';

const isIOS10 = (): boolean => {
    if (Platform.OS !== 'ios') return false;

    // @ts-ignore
    const majorVersionIOS = parseInt(Platform.Version, 10);

    if (majorVersionIOS <= 10) {
        return true;
    }

    return false;
};

const IsIPhoneX = (): boolean => {
    const { height, width } = Dimensions.get('window');
    return (
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (height === 812 || width === 812 || height === 896 || width === 896 || height === 926 || width === 926)
    );
};

const getBottomTabScale = (factor?: number): number => {
    if (Platform.OS !== 'ios') return 0;
    const ratio = PixelRatio.get();

    let scale;
    switch (ratio) {
        case 2:
            scale = 4.5;
            break;
        case 3:
            scale = 6;
            break;
        default:
            scale = ratio * 2;
    }

    if (factor) {
        return scale * factor;
    }

    return scale;
};

/* Export ==================================================================== */
export { IsIPhoneX, isIOS10, getBottomTabScale };
