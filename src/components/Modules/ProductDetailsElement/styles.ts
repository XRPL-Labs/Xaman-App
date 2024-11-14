import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        alignItems: 'center',
    },
    tokenImageContainer: {
        marginRight: 10,
    },
    description: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        paddingHorizontal: AppSizes.padding,
        paddingVertical: AppSizes.paddingExtraSml,
        textAlign: 'center',
        color: '$textPrimary',
    },
    benefitsText: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$orange',
    },
    priceContainer: {
        alignSelf: 'stretch',
        backgroundColor: StyleService.select({ dark: '$lightOrange', light: '$lightOrange' }),
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        borderColor: '$orange',
        padding: AppSizes.paddingSml,
        marginTop: AppSizes.paddingSml,
    },
    price: {
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyExtraBold,
        color: StyleService.select({ dark: '$white', light: '$darkGrey' }),
    },
    errorContainer: {
        backgroundColor: StyleService.select({ dark: '$lightRed', light: '$red' }),
    },
    errorText: {
        paddingBottom: AppSizes.paddingSml,
        flexWrap: 'wrap',
        flexShrink: 1,
        textAlign: 'center',
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$red',
    },
    textPlaceholder: {
        color: StyleService.select({ dark: '$grey', light: '$silver' }),
        backgroundColor: StyleService.select({ dark: '$grey', light: '$silver' }),
    },
    priceDescription: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.small.size,
        color: StyleService.select({ dark: '$light', light: '$silver' }),
    },
    checkMarkIcon: {
        tintColor: '$orange',
    },
    checkMarkIconPlaceholder: {
        tintColor: StyleService.select({ dark: '$grey', light: '$silver' }),
        opacity: 0.8,
    },
});
