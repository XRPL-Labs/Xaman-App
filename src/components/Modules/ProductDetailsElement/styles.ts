import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        backgroundColor: StyleService.select({ dark: '$tint', light: '$lightOrange' }),
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
        color: '$textPrimary',
        marginBottom: AppSizes.paddingSml,
    },
    price: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.select({ dark: '$orange', light: '#D35400' }),
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
