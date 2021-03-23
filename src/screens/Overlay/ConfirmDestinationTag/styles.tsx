/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppStyles, AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        backgroundColor: '$background',
        borderRadius: AppSizes.screen.width * 0.07,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },

    iconError: {
        tintColor: '$red',
    },
    iconWarning: {
        tintColor: '$orange',
    },
    iconInfo: {
        tintColor: '$lightBlue',
    },
    iconSuccess: {
        tintColor: '$green',
    },
    title: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size * 0.9,
        color: '$orange',
    },
    subTitle: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    destinationTagText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h3.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
});

export default styles;
