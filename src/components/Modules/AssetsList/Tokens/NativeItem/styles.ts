import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    currencyItem: {
        justifyContent: 'space-between',
        // backgroundColor: '$lightBlue',
        borderRadius: 10,
        // paddingHorizontal: 5,
        // paddingVertical: 5,
        marginHorizontal: AppSizes.paddingSml,
        // borderColor: '$red',
        // borderWidth: 2,
    },
    balanceRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    buyButton: {
        paddingLeft: 5,
        paddingRight: 2,
        height: AppSizes.scale(20),
        borderRadius: 7,
        marginTop: AppSizes.scale(-1),
    },
    buyIcon: {
        tintColor: StyleService.select({ light: '$black', dark: '$white' }),
    },
    reserveTextValue: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$grey',
        // marginRight: 5,
    },
    reserveTextValueCurrency: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.small.size * 0.7,
        marginTop: 1.5,
        marginRight: 2,
    },
    reserveTextValueNonBold: {
        fontFamily: AppFonts.base.familyMono,
    },
    buyButtonText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppSizes.scale(12),
        paddingLeft: 2,
        color: StyleService.select({ light: '$black', dark: '$white' }),
    },
    reserveRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        paddingTop: 2,
        paddingBottom: 5,
    },
    currencyItemLabel: {
        // fontSize: AppFonts.h5.size,
        // fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.subtext.size * 1.1,
        fontFamily: AppFonts.base.familyBold,
        color: StyleService.select({ light: '$dark', dark: '$white' }),
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
    },
    balanceText: {
        fontSize: AppFonts.subtext.size * 1.25,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.select({ light: '$dark', dark: '$white' }),
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 0,
    },
    tokenAvatarContainer: {
        marginRight: 10,
    },
    tokenIcon: {
        tintColor: StyleService.select({ light: '$dark', dark: '$white' }),
    },
    tokenIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 10,
    },
    reserveCurrencyAvatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 7,
    },
    reserveCurrencyAvatarContainerInline: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 3,
        // paddingLeft: 6,
        marginTop: 1,
    },
    reserveTextContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    reserveTextLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.family,
        color: '$grey',
        paddingRight: 6,
    },
    reserveInfoIconContainer: {
        paddingLeft: AppSizes.scale(14),
        paddingRight: AppSizes.scale(13),
        backgroundColor: '$tint',
        borderRadius: AppSizes.scale(8),
        paddingVertical: AppSizes.scale(4),
        marginTop: AppSizes.scale(1),
    },
    fiatAmountText: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.select({ light: '$blue', dark: '$white' }),
        // marginRight: 5,
    },
    rightContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
});
