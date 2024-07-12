/**
 * App Theme - Fonts
 */

import { Platform } from 'react-native';
import Sizes from './sizes';

const guidelineBaseWidth = Platform.OS === 'ios' ? 350 : 400;

export const scaleFontSize = (size: number) => (Sizes.screen.width / guidelineBaseWidth) * size;

const base = {
    size: scaleFontSize(15),
    lineHeight: 25,
    family: Platform.select({
        ios: 'ProximaNova-Regular',
        android: 'Proxima Nova Regular',
    }),
    familyBold: Platform.select({
        ios: 'ProximaNova-Bold',
        android: 'Proxima Nova Bold',
    }),
    familyExtraBold: Platform.select({
        ios: 'ProximaNova-Extrabld',
        android: 'Proxima Nova Extrabold',
    }),
    familyMono: 'UbuntuMono-Regular',
    familyMonoBold: 'UbuntuMono-Bold',
};

export default {
    scaleFontSize,
    base: { ...base },
    small: { size: scaleFontSize(12), family: base.family },
    subtext: { size: scaleFontSize(14), family: base.family },
    p: { ...base, size: scaleFontSize(16), family: base.family },
    pb: { ...base, size: scaleFontSize(16), family: base.familyBold },
    // headings
    h1: { ...base, size: scaleFontSize(40), family: base.familyExtraBold },
    h2: { ...base, size: scaleFontSize(35), family: base.familyExtraBold },
    h3: { ...base, size: scaleFontSize(30), family: base.familyExtraBold },
    h4: { ...base, size: scaleFontSize(25), family: base.familyExtraBold },
    h5: { ...base, size: scaleFontSize(20), family: base.familyExtraBold },
};

// Proxima Nova Alt
// ProximaNovaA-Light
// ProximaNovaA-Bold
// ProximaNovaA-Thin

// ProximaNova-Extrabld
// ProximaNova-Black
// ProximaNovaT-Thin
// ProximaNova-Bold
// ProximaNova-Regular
