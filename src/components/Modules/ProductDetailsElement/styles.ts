import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        backgroundColor: StyleService.select({ dark: '$light', light: '$darkGrey' }),
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '$tint',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
    },
    tokenImageContainer: {
        marginRight: 10,
    },
    description: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$textContrast',
    },
    price: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.select({ dark: '$darkGrey', light: '$orange' }),
        marginTop: AppSizes.paddingSml,
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
        color: StyleService.select({ dark: '$darkGrey', light: '$light' }),
    },
    textPlaceholder: {
        color: StyleService.select({ dark: '$grey', light: '$silver' }),
        backgroundColor: StyleService.select({ dark: '$grey', light: '$silver' }),
    },
    title: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.small.size,
        color: StyleService.select({ dark: '$grey', light: '$silver' }),
    },
});
