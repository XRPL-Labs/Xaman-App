/**
 * App Theme - Fonts
 */

/* eslint-disable spellcheck/spell-checker */
import { Platform } from 'react-native';
import Sizes from './sizes';

const guidelineBaseWidth = Platform.OS === 'ios' ? 350 : 400;

const scale = (size: number) => (Sizes.screen.width / guidelineBaseWidth) * size;

const base = {
    size: scale(15),
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
    base: { ...base },
    small: { size: scale(12), family: base.family },
    subtext: { size: scale(14), family: base.family },
    p: { ...base, size: scale(16), family: base.family },
    pb: { ...base, size: scale(16), family: base.familyBold },
    // headings
    h1: { ...base, size: scale(40), family: base.familyExtraBold },
    h2: { ...base, size: scale(35), family: base.familyExtraBold },
    h3: { ...base, size: scale(30), family: base.familyExtraBold },
    h4: { ...base, size: scale(25), family: base.familyExtraBold },
    h5: { ...base, size: scale(20), family: base.familyExtraBold },
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
